
var current_browser_datasource='snapshots';
var already_loaded_collector = null;
var snapshot_browser_first_click=true;
var search_term='';
function setup_browser_interface()
{
    document.getElementById('search').onchange = async function(){
        //window.alert('suche:'+ $('#search').val());
        search_term=$('#search').val();
        load_browser(current_browser_datasource);
    }

    document.getElementById('sel_browser_snapshots').onclick = async function(){
        await get_data_collector('csdb').wait_until_finish();
 
        $('#sel_browser_snapshots').parent().removeClass('btn-secondary').removeClass('btn-primary')
        .addClass('btn-primary');
        $('#sel_browser_csdb').parent().removeClass('btn-secondary').removeClass('btn-primary')
        .addClass('btn-secondary');
        browser_datasource='snapshots';
        search_term=''; $('#search').val('').attr("placeholder", "search snapshots (local browser storage)");
        load_browser('snapshots');
    }

    document.getElementById('sel_browser_csdb').onclick = async function(){
        await get_data_collector('snapshots').wait_until_finish();

        $('#sel_browser_csdb').parent().removeClass('btn-secondary').removeClass('btn-primary')
        .addClass('btn-primary');
        $('#sel_browser_snapshots').parent().removeClass('btn-secondary').removeClass('btn-primary')
        .addClass('btn-secondary');
        search_term=''; $('#search').val('').attr("placeholder", "search inside csdb.dk");
        load_browser('csdb');
    }


    $('#snapshotModal').on('shown.bs.modal', function () {
        hide_all_tooltips();

        var view_detail=$("#view_detail");
        if(view_detail.is(":visible"))
        {
            view_detail.focus();
        }
    });


    $('#snapshotModal').on('hidden.bs.modal', function () {
        wasm_resume_auto_snapshots();
        if(is_running())
        {
            try{wasm_run();} catch(e) {}
        }
    });

    //button in navbar menu
    document.getElementById('button_snapshots').onclick = async function() 
    {
        await load_browser(current_browser_datasource);
        if(snapshot_browser_first_click)
        {//if there are no taken snapshots -> select csdb
            snapshot_browser_first_click=false;
            var snapshot_collector=get_data_collector("snapshots");
            //wait until snapshots are a loaded
            await snapshot_collector.wait_until_finish();
            //and now look into snapshots
            if(snapshot_collector.total_count==0)
            { 
                $('#sel_browser_csdb').click();   
            }
        }   
    }
}

async function load_browser(datasource_name)
{
    current_browser_datasource=datasource_name;

    internal_usersnapshots_enabled=false;

    if(is_running())
    {
        wasm_halt();
    }

    wasm_suspend_auto_snapshots();

    //-- build snapshot feed
    var collector=get_data_collector(datasource_name);

    if(collector.needs_reload() == false && search_term=='')
    {
        return;
    }
    //empty all feeds
    $('#container_snapshots').empty();

    var render_persistent_snapshot=function(app_title, item){
        var x_icon = '<svg width="1.8em" height="auto" viewBox="0 0 16 16" class="bi bi-x" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708-.708l7-7a.5.5 0 0 1 .708 0z"/><path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708l-7-7a.5.5 0 0 0-.708 0z"/></svg>';
        var scaled_width= 15;
        var canvas_width = 384;
        var canvas_height= 272;
        var the_html=
        '<div class="col-xs-4 mr-2">'
        +`<div id="card_snap_${item.id}" class="card" style="width: ${scaled_width}rem;">`
            +`<canvas id="canvas_snap_${item.id}" width="${canvas_width}" height="${canvas_height}" class="card-img-top rounded"></canvas>`;
        if(collector.can_delete(app_title, item.id))
        {
            the_html += '<button id="delete_snap_'+item.id+'" type="button" style="position:absolute;top:0;right:0;padding:0;" class="btn btn-sm icon">'+x_icon+'</button>';
        }

       //the_html +='<div class="card-body"><p class="card-text">Some quick example</p></div>';
        
        var label = item.name;
        if(label !== undefined && label != null)
        {
            the_html +='<p class="card-text browser-item-text">'+ $('<span>').text(label).html()+'</p>';
        }

        the_html +=
            '</div>'
        +'</div>';
        return the_html;
    }

    var row_renderer = function(app_title, app_snaps) {
        //app_title=app_title.split(' ').join('_');
        var the_grid ="";
        if(app_snaps.length>0)
        {
            the_grid+='<div class="row mt-2" style="color: var(--gray)">'+app_title+'</div>';
        }
        the_grid+='<div class="row" data-toggle="tooltip" data-placement="left" title="'+app_title+'">';

        for(var z=0; z<app_snaps.length; z++)
        {
            the_grid += render_persistent_snapshot(app_title, app_snaps[z]);
        }
        the_grid+='</div>';
        $('#container_snapshots').append(the_grid);
        for(var z=0; z<app_snaps.length; z++)
        {
            var canvas_id= "canvas_snap_"+app_snaps[z].id;
            var delete_id= "delete_snap_"+app_snaps[z].id;
            var canvas = document.getElementById(canvas_id);
            var delete_btn = document.getElementById(delete_id);
            if(delete_btn != null)
            {
                delete_btn.onclick = function() {
                    let id = this.id.match(/delete_snap_(.*)/)[1];
                    //alert('delete id='+id);
                    delete_snapshot_per_id(id);
                    $("#card_snap_"+id).remove();
                    hide_all_tooltips();
                };
            }

            canvas.onclick = function() {
                let id = this.id.match(/canvas_snap_(.*)/)[1];
                collector.show_detail(app_title, id);
            };
            collector.draw_item_into_canvas(app_title, canvas, app_snaps[z]);  
        }
    }

    //start the loading process
    if(search_term=='')
    {
        collector.load(row_renderer);
    }
    else
    {
        collector.search(row_renderer);
    }
    already_loaded_collector=collector; 
}




var collectors = {
    snapshots: {
        total_count: 0,
        set_busy: function (busy_value) 
        { 
            console.log("snapshot.busy="+busy_value);
            this.busy = busy_value;
        },
        busy: false,
        wait_until_finish: async function() {
            var i=0;
            console.log(`snapshot.check on busy in waituntil busy=`+this.busy);
            while(this.busy)
            {
                console.log(`snapshots collector is busy since ${i*10}ms`);
                await sleep(100);
                i++;
            }
        },
        needs_reload: () => true,
        search: async function (row_renderer){
            console.log("snapshot search");  
            await this.wait_until_finish(); 
            this.load(row_renderer);
        },
        load: async function (row_renderer){
            console.log("snapshot load");
            await this.wait_until_finish(); 
            this.set_busy(true);
            try
            {
                //first load autosave snapshots
                var auto_save_count=wasm_auto_snapshots_count();
                var auto_save_items=[];
                for(var z=0; z<auto_save_count; z++)
                {
                    var new_item = new Object();
                    new_item.id='a'+z;
                    new_item.internal_id=z;
                    auto_save_items.push(new_item);
                }
                row_renderer('auto_save',auto_save_items);

                this.total_count=auto_save_count;

                //now the user snapshots
                var store_renderer = function(app_titles)
                {
                    get_data_collector('snapshots').total_count+=app_titles.length;
                    for(var t=0; t<app_titles.length;t++)
                    {
                        var app_title=app_titles[t];
                        if(search_term == '' || app_title.toLowerCase().indexOf(search_term.toLowerCase()) >= 0)
                        {
                            get_snapshots_for_app_title(app_title, row_renderer);
                        }
                    }
                    get_data_collector('snapshots').set_busy(false);
                }
                await get_stored_app_titles(store_renderer);
            }
            finally
            {
            }
        },
        draw_item_into_canvas: function (app_title, teaser_canvas, item){
            if(app_title == 'auto_save')
            {
                var id = item.internal_id; 
                snapshot_ptr = wasm_pull_auto_snapshot(id);
                var width=wasm_auto_snapshot_width(id);
                var height=wasm_auto_snapshot_height(id);
                this.copy_snapshot_to_canvas(snapshot_ptr, teaser_canvas, width, height);
            }
            else
            {
                width=392;
                height=268;
                var ctx = teaser_canvas.getContext("2d");
                teaser_canvas.width = width;
                teaser_canvas.height = height;

                imgData=ctx.createImageData(width,height);
            
                var data = imgData.data;
                var src_data = item.data;
                snapshot_data = new Uint8Array(src_data, 40/* offset .. this number was a guess... */, data.length);

                for (var i = 0; i < data.length; i += 4) {
                    data[i]     = snapshot_data[i+0]; // red
                    data[i + 1] = snapshot_data[i+1]; // green
                    data[i + 2] = snapshot_data[i+2]; // blue
                    data[i + 3] = snapshot_data[i+3];

                }
                ctx.putImageData(imgData,0,0); 
            }
            return; 
        },
        show_detail: function (app_title, id){
            if(app_title == 'auto_save')
            {
                var _id=id.substring(1);
                wasm_restore_auto_snapshot(_id);
                $('#snapshotModal').modal('hide');
            }
            else
            {
                get_snapshot_per_id(id,
                    function (snapshot) {
                        wasm_loadfile(
                            snapshot.title+".vc64",
                            snapshot.data, 
                            snapshot.data.length);
                        $('#snapshotModal').modal('hide');
                        global_apptitle=snapshot.title;
                        get_custom_buttons(global_apptitle, 
                            function(the_buttons) {
                                custom_keys = the_buttons;
                                install_custom_keys();
                            }
                        );
                    }
                );
            }

            if(!is_running())
            {
                $("#button_run").click();
            }
            return; 
        },
        can_delete: function(app_title, the_id){
            return app_title == 'auto_save' ? false: true;
        },
        //helper method...
        copy_snapshot_to_canvas: function(snapshot_ptr, canvas, width, height){ 
            var ctx = canvas.getContext("2d");
            canvas.width = width;
            canvas.height = height;
            imgData=ctx.createImageData(width,height);

            var data = imgData.data;

            snapshot_data = new Uint8Array(Module.HEAPU8.buffer, snapshot_ptr, data.length);

            for (var i = 0; i < data.length; i += 4) {
                data[i]     = snapshot_data[i+0]; // red
                data[i + 1] = snapshot_data[i+1]; // green
                data[i + 2] = snapshot_data[i+2]; // blue
                data[i + 3] = snapshot_data[i+3];

            }
            ctx.putImageData(imgData,0,0); 
        }
    },

    csdb: {
        busy: false,
        set_busy: function (busy_value) 
        { 
            console.log("csdb.busy="+busy_value);
            this.busy = busy_value;
        },
        wait_until_finish: async function() {
            var i=0;
            console.log(`csdb.check on busy in waituntil busy=`+this.busy);
            while(this.busy)
            {
                console.log(`csdb collector is busy since ${i*10}ms`);
                await sleep(100);
                i++;
            }
        },
        all_ids: [],
        all_items: [],
        loaded_feeds: null,
        loaded_search: null,
        last_load_was_a_search: false,
        needs_reload: function ()
        { 
            return already_loaded_collector != this || this.loaded_feeds == null || last_load_was_a_search;
        },
        search: async function (row_renderer){
            await this.wait_until_finish();
            this.set_busy(true);
            last_load_was_a_search=true;
            try
            {
                //this.loaded_feeds = null; //force reload
/*                if(this.loaded_feeds!=null)
                {
                    for(var row_key in this.loaded_feeds)
                    {
                        row_renderer(row_key, this.loaded_feeds[row_key]);
                    }
                    return;
                }
*/
                this.all_ids= [];
                this.all_items= [];
                this.loaded_search = [];
                var webservice_loader = async response => {
                    try{
                        var items=[];

                        var text = await response.text();
                        //alert(text);
                        var parser = new DOMParser();
                        var xmlDoc = parser.parseFromString(text,"text/xml");

                        var releases = xmlDoc.getElementsByTagName("Release");

                        for(var xml_item of releases)
                        {
                            var id = xml_item.getElementsByTagName("ID")[0].textContent;

                            if(this.all_ids.includes(id))
                            {//this entry was already in another feed, skip it
                                continue;
                            }
                            this.all_ids.push(id);

                            var new_item = new Object();
                            new_item.id=id;
                            new_item.name = property(xml_item,"Name");
                            new_item.type = property(xml_item,"Type");
                            new_item.date = new Date(
                                property(xml_item,"ReleaseYear"),
                                property(xml_item,"ReleaseMonth")-1,  //month is 0 indexed
                                property(xml_item,"ReleaseDay")
                            ).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                            new_item.screen_shot = property(xml_item,"ScreenShot");
                            new_item.links = property_list(xml_item,"Link", matches=/http.*?[.](zip|prg|t64|d64|g64|tap|crt)$/i);

                            //alert(`id=${id}, name=${name}, screen_shot=${screen_shot}`);
                            if(new_item.screen_shot!= null)
                            {
                                this.all_items[id] = new_item;
                                items.push(new_item);
                            }
                        }
                        this.loaded_search[this.row_name] = items;

                        var type_rows = [];
                        for(item of items)
                        {
                            if(type_rows[item.type]==null)
                            {
                                type_rows[item.type] = [];
                            }
                            type_rows[item.type].push(item);
                        }
                        for(row_type in type_rows)
                        {
                            row_renderer(row_type,type_rows[row_type]);
                        }

                    }
                    catch {}
                }

                this.row_name='suche';
                await fetch(`https://csdb.dk/webservice/?type=search&stype=release&q=${search_term}&depth=1.5`).then( webservice_loader );

            }
            finally
            {
                this.set_busy(false);
            }
        },
        load: async function (row_renderer){
            await this.wait_until_finish();
            this.set_busy(true);
            last_load_was_a_search=false;
            try
            {
                //this.loaded_feeds = null; //force reload
                if(this.loaded_feeds!=null)
                {
                    this.all_items=[];
                    for(var row_key in this.loaded_feeds)
                    {
                        for(feed_item of this.loaded_feeds[row_key])
                        {
                            this.all_items[feed_item.id]=feed_item;
                        }
                        row_renderer(row_key, this.loaded_feeds[row_key]);
                    }
                    return;
                }
                this.all_ids= [];
                this.all_items= [];
                this.loaded_feeds = [];
                var webservice_loader = async response => {
                    try{
                        var items=[];

                        var text = await response.text();
                        //alert(text);
                        var parser = new DOMParser();
                        var xmlDoc = parser.parseFromString(text,"text/xml");

                        var releases = xmlDoc.getElementsByTagName("Release");

                        for(var xml_item of releases)
                        {
                            var id = xml_item.getElementsByTagName("ID")[0].textContent;

                            if(this.all_ids.includes(id))
                            {//this entry was already in another feed, skip it
                                continue;
                            }
                            this.all_ids.push(id);

                            var new_item = new Object();
                            new_item.id=id;
                            new_item.name = property(xml_item,"Name");
                            new_item.type = property(xml_item,"Type");
                            new_item.date = new Date(
                                property(xml_item,"ReleaseYear"),
                                property(xml_item,"ReleaseMonth")-1,  //month is 0 indexed
                                property(xml_item,"ReleaseDay")
                            ).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                            new_item.screen_shot = property(xml_item,"ScreenShot");
                            new_item.links = property_list(xml_item,"Link", matches=/http.*?[.](zip|prg|t64|d64|g64|tap|crt)$/i);

                            //alert(`id=${id}, name=${name}, screen_shot=${screen_shot}`);
                            if(new_item.screen_shot!= null)
                            {
                                this.all_items[id] = new_item;
                                items.push(new_item);
                            }
                        }
                        this.loaded_feeds[this.row_name] = items;
                        row_renderer(this.row_name,items);
                        //await sleep(200);
                    }
                    catch {}
                }

                this.row_name='top one file demos';
                await fetch('https://csdb.dk/webservice/?type=chart&ctype=release&subtype=2&depth=1.5').then( webservice_loader );
            
                this.row_name='top demos';
                await fetch('https://csdb.dk/webservice/?type=chart&ctype=release&subtype=1&depth=1.5').then( webservice_loader );
                
                this.row_name='latest releases';
                await fetch('https://csdb.dk/webservice/?type=latestrel&depth=1.5').then( webservice_loader );        

                this.row_name='latest additions';
                await fetch("https://csdb.dk/webservice/?type=latestadd&addtype=release&depth=1.5").then( webservice_loader );
                
                this.row_name='top music';
                await fetch("https://csdb.dk/webservice/?type=chart&ctype=release&subtype=7&depth=1.5").then( webservice_loader );
                
                this.row_name='top music - part2';
                await fetch("https://csdb.dk/webservice/?type=chart&ctype=release&subtype=8&depth=1.5").then( webservice_loader );

                this.row_name='top graphics';
                await fetch("https://csdb.dk/webservice/?type=chart&ctype=release&subtype=9&depth=1.5").then( webservice_loader );

                this.row_name='top graphics - part2';
                await fetch("https://csdb.dk/webservice/?type=chart&ctype=release&subtype=10&depth=1.5").then( webservice_loader );

                this.row_name='top games';
                await fetch("https://csdb.dk/webservice/?type=chart&ctype=release&subtype=11&depth=1.5").then( webservice_loader );
            }
            finally
            {
                this.set_busy(false);
            }
        },
        draw_item_into_canvas: function (app_title, teaser_canvas, item){
            var ctx = teaser_canvas.getContext('2d');
            var img = new Image;
            img.onload = function(){
                ctx.drawImage(img,0,0); // Or at whatever offset you like
            };
            if(item.screen_shot != null)
            {
                img.src=item.screen_shot;
            }
            return; 
        },
        show_detail:function (app_title, id){
            var item = this.all_items[id];
            //fetching details
            var csdb_detail_url = `https://csdb.dk/webservice/?type=release&id=${id}&depth=2`;

            if(item.details_already_fetched !== undefined )
            {
                this.render_detail(app_title, id);
                this.render_detail2(app_title, id);
            }
            else
            {
                //show already loaded content
                this.render_detail(app_title, id);

                //fetch more details about the entry
                fetch(csdb_detail_url).then( async response => {
                    var text = await response.text();
                    //alert(text);
                    var parser = new DOMParser();
                    var xmlDoc = parser.parseFromString(text,"text/xml");

                    //already loaded with depth=1.5
/*                  
                    //getting links <Release><DownloadLinks><DownloadLink><Link>
                    var dl_links = property_path(xmlDoc, "Release/DownloadLinks");
                    item.links = [];
                    for(var dl_link of dl_links)
                    {
                        item.links.push.apply(item.links, 
                            property_list(dl_link,"Link", matches=/http.*?[.](zip|prg|t64|d64|g64|tap|crt)$/i)
                            );
                    }
*/
                    //getting user comments
                    item.comments = [];
                    var user_comments= property_path(xmlDoc,"Release/Comments/UserComment");
                    if(user_comments != null)
                    {
                        for(var user_comment of user_comments)
                        {
                            var new_user_comment = new Object();
                            new_user_comment.text= property(user_comment, "Text");
                            new_user_comment.date= property(user_comment, "Date");
                            new_user_comment.user= property(user_comment, "CSDbUser/Login");
                            
                            item.comments.push(new_user_comment);
                        }
                    }

                    //getting summary                   
                    var summary= property_path(xmlDoc,"Release/Comments/Summary");
                    if(summary != null && summary.length>0)
                    {
                        var new_summary = new Object();
                        new_summary.text= property(user_comment, "Text");
                        new_summary.date= property(user_comment, "Date");
                        new_summary.user= property(user_comment, "CSDbUser/Login");

                        item.summary=new_summary;
                    }

                    item.details_already_fetched=true;
                    this.render_detail2(app_title, id);
                });
            }
        },
        render_detail: function (app_title, id){
            hide_all_tooltips();
            $("#view_detail").show().scrollTop(0).focus();

            $("#detail_back").click(function(){
                $("#view_detail").hide();
                $('#snapshotModal').focus();
            });

            var item = this.all_items[id];

            var content = '<div class="container-xl">';

            content += '<div class="row justify-content-md-center">';
            content += '<div class="col col-md-12">';
                content += `<image src="${item.screen_shot}" class="detail_screenshot"/>`;
            content += '</div>';
            content += '</div>'; //row
            
            content += '<div class="row justify-content-md-center mt-4">';
            content += '<div class="col col-xs-auto">';
    
                content += `<h2>${item.name}</h2>`;
                content += `<h4>${item.type} | ${item.date}</h4>`;
        
            content += '</div>'; //col


            content += '<div class="col-xs text-right px-0 mr-3">';
                content += `<a style="color: var(--secondary);font-size: large;" href="https://csdb.dk/release/?id=${id}" target="_blank"><svg class="mr-3" width="1.8em" height="1.8em" viewBox="0 0 16 16" class="bi bi-box-arrow-up" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/>
  <path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 1.707V10.5a.5.5 0 0 1-1 0V1.707L5.354 3.854a.5.5 0 1 1-.708-.708l3-3z"/>
</svg><br><span class="mr-1">open in</span><br><span class="mr-0">csdb.dk</span></a>`;
            content += '</div>'; //col


            content += '</div>'; //row



            content += '<div class="row justify-content-md-center mt-4 pb-4">';
            content += '<div class="col col-md-12">';
            var vc64web_URL='https://dirkwhoffmann.github.io/virtualc64web/';
            var link_id=0;
            for(var link of item.links)
            {
                var link_path = link.split('/');
                var link_name = decodeURIComponent(link_path[link_path.length-1]);
                var encoded_link = '';
                for(var i=0; i<link_path.length-1;i++)
                {
                    encoded_link += link_path[i] + '/'; 
                }
                encoded_link += encodeURIComponent(link_name);

                content += `<button type="button" id="detail_run${link_id}" class="btn btn-primary my-2">
                ${link_name}
                <svg width="1.8em" height="1.8em" viewBox="0 0 16 16" class="bi bi-play-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>
                </button>`;

                content += `
                <div class="row">
                <div class="col-12">
                <button type="button" data-toggle="tooltip" data-placement="bottom" title="copy to clipboard for sharing"
                  onclick="var copyText = document.getElementById('detail_link${link_id}');copyText.select();copyText.setSelectionRange(0, 99999);document.execCommand('copy');"
                  class="btn btn-secondary btn-sm copy-btn" id="copy_${link_id}"><svg width="1.8em" height="1.8em" viewBox="0 0 16 16" class="bi bi-clipboard-plus" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                <path fill-rule="evenodd" d="M9.5 1h-3a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3zM8 7a.5.5 0 0 1 .5.5V9H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V10H6a.5.5 0 0 1 0-1h1.5V7.5A.5.5 0 0 1 8 7z"/>
              </svg></button>
                <input class="copy_run_link" type="text" value="${vc64web_URL}#${encoded_link}" id="detail_link${link_id}"></input>
                </div>
                </div>`;

                link_id++;
            }
            content += '</div>'; //col
            content += '</div>'; //row
            content += '</div>'; //container

            $("#detail_content").html(content);


            link_id=0;
            for(var link of item.links)
            {
                $(`#detail_run${link_id}`).click(function (){
                    var clicked_link_id=this.id.match("detail_run(.*)")[1];
                    already_loaded_collector.run_link(app_title, id, item.links[clicked_link_id]);
                });
                link_id++;
            }


            var esc_on_detail=function( event ) {
                event.stopPropagation();
                if(event.key === "Escape")
                {
                    $("#view_detail").hide();
                    $('#snapshotModal').focus();
                }
                return false;
            }

            $( "#view_detail" ).keyup(esc_on_detail)
            .keydown(function( event ) {
                event.stopPropagation();
                return false;
            });

        },
        render_detail2: function (app_title, id){
            var item = this.all_items[id];

            var content = '<div class="container">';
            var the_date= null;
            if(item.summary !== undefined )
            {
                the_date=item.summary.date;
                content+=`<h4 class="mx-1">summary</h4>
                <p class="px-2 mb-0 font-weight-light" style="color:darkgoldenrod">${item.summary.date}</p>
                <p class="px-4 mx-1 mb-0 font-weight-light">${item.summary.user == null ? "": item.summary.user}</p>
                <p class="font-italic mx-4 px-4">${item.summary.text}</p>
                `;
            }

            if(item.comments.length>0)
            {
                content += `<h4 class="mx-1">comments</h4>`;
            }

            for(var comment of item.comments)
            {
                if(comment.date != the_date)
                {
                    content+=`
                    <p class="px-2 mb-0 font-weight-light" style="color:darkgoldenrod">${comment.date}</p>`;
                    the_date=comment.date;
                }
                content+=`
                    <p class="px-4 mx-1 mb-0 font-weight-light">${comment.user==null?"":comment.user}  </p>
                    <p class="font-italic mx-4 px-4">${comment.text}</p>
                `;
            }
            content += '</div>';

          

            $("#detail_content").append(content);
            
        },
        run_link: function (app_title, id, link){
            //alert(`run ${app_title} with ${id}`);
            var download_url = link.replace('http://', 'https://')
            //alert(download_url);

            fetch(download_url).then( async response => {
                file_slot_file_name = decodeURIComponent(response.url.match(".*/(.*)$")[1]);
                file_slot_file = new Uint8Array( await response.arrayBuffer());
                if(app_title == "call_parameter" && id == 0)
                {
                    configure_file_dialog(reset=false);
                }   
                else
                {               
                    configure_file_dialog(reset=true);
                }
            });

            $('#snapshotModal').modal('hide');

            return; 
        },
        can_delete: function(app_title, the_id){
            return false;
        }
    }

};


function get_data_collector(collector_name)
{
    return collectors[collector_name];
}



function property(xml_root_item, property_name) {
    var val=null;
    var xml_item=property_path(xml_root_item, property_name);
    try{
        val=xml_item[0].textContent;
    } catch {}
    return val;
}
function property_list(xml_root_item, property_name, matches=null) {
    var list=[];
    var xml_item=property_path(xml_root_item, property_name);
    try{
        for(var element of xml_item)
        {
            if(matches==null || element.textContent.match(matches)!=null)
            {
                list.push(element.textContent);
            }
        }
    } catch {}
    return list;
}
function property_path(xml_root_item, property_path) {
    var xml_element=xml_root_item;
    var path = property_path.split('/');
    try{
        for(var element_name of path)
        {
            if(xml_element instanceof HTMLCollection)
            {
              if(xml_element.length==0)
              {
                  return null;
              }
              xml_element = xml_element[0];

            }
            xml_element=xml_element.getElementsByTagName(element_name);
        }
    } catch(e) {
        console.error(e);
    }
    return xml_element;
}
