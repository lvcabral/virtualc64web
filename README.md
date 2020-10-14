# virtualC64 web edition

![alt Logo](http://www.dirkwhoffmann.de/software/images/banner-vcweb3.jpg)

## info
this project aims to build a fancy, cool and stylish version of dirks VirtualC64 emulator with pure HTML5 techniques for desktop browsers and touch devices like phones and tablets ... 

The base is a copy of virtualC64 without its usual mac GUI in v3.4b1 master branch March 3 2020 latest commit point fe1629c


## start up VirtualC64Web right now in your browser
https://dirkwhoffmann.github.io/virtualc64web/

on a touch screen device, don't forget to save it to homescreen as it fully supports the PWA standard and for that will behave like a real app and not just like a browser app (with save to homescreen you will get rid of all those unwanted browser gestures like adressbar swipe back and swipe forward, etc...)  

## what happened so far ...
https://github.com/dirkwhoffmann/vAmiga/issues/291

## how to build and run it in a web browser 
* install [emsdk](https://emscripten.org/docs/getting_started/downloads.html) 
* clone this repository into a folder 
* cd into that folder
* copy c64-roms (four .bin files) into subfolder roms (this is optional ... roms can be loaded into emulator while running)
* make 
* make main
* ./start.sh
* open your browser and head to http://localhost:8080/

_note_: start.sh starts an webserver with URL base path pointing to the folder where the build resides.

## already achieved goals 
* builds without errors in emsdk  (output vC64.html, vC64.js, vC64.wasm, vC64.data)
* runs Octopus in redwine demo in a browser
* sound output
* replace the standard emsdk html page and build a specific html5 file which allows to insert disks ... 
* keyboard works for many keys 
* completing and extending the Javascript API for keyboard and joystick controller input from  HTML5 side
* non persistent snapshot support
* additional modal dialog to load roms via file dialog and save them to the browsers local storage, in case they are not already embedded in folder roms ...   
* a virtual keyboard
* storing selected snapshots into local storage ... effectively making those choosen snapshots persistent 
* virtual joystick for touch screen devices
* free positional custom keys as button overlays (aka action buttons) which trigger an action (but no script yet)
* zip support, and enhanced multidisk support when using zip archives 
* action script for the self composed action sequence overlay buttons 
* self designed editable javascript miniprograms which for example are able to control a game ... yes ... bots
* Demo-Scene-Browser: v64web implements an easy browsable online interface to the CSDb scene db with lots of the cool demos 

## next goals
* polishing of the scene browser UI component ... show more infos about each entry
* new  modern boot sequence/animation  replacing the standard emscripten visual boot code 
* javascript interface for more settings of the emulation like (greydotbugemulation) 
* export/import of a complete snapshot library as one big zip file 
