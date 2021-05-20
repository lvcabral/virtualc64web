// -----------------------------------------------------------------------------
// This file is part of VirtualC64
//
// Copyright (C) Dirk W. Hoffmann. www.dirkwhoffmann.de
// Licensed under the GNU General Public License v3
//
// See https://www.gnu.org for license information
// -----------------------------------------------------------------------------

#pragma once

#include "Aliases.h"
#include "Reflection.h"

//
// Enumerations
//

enum_long(DOS_TYPE)
{
    DOS_TYPE_NODOS,
    DOS_TYPE_CBM,
    DOS_TYPE_COUNT
};
typedef DOS_TYPE DOSType;

#ifdef __cplusplus
struct DOSTypeEnum : util::Reflection<DOSTypeEnum, DOSType> {
    
    static bool isValid(long value)
    {
        return (unsigned long)value <= DOS_TYPE_CBM;
    }
    
    static const char *prefix() { return "DOS_TYPE"; }
    static const char *key(DOSType value)
    {
        switch (value) {
                
            case DOS_TYPE_NODOS:  return "NODOS";
            case DOS_TYPE_CBM:    return "CBM";
            default:              return "???";
        }
    }
};
#endif

enum_long(FS_FILETYPE)
{
    FS_FILETYPE_DEL = 0,
    FS_FILETYPE_SEQ = 1,
    FS_FILETYPE_PRG = 2,
    FS_FILETYPE_USR = 3,
    FS_FILETYPE_REL = 4,
    FS_FILETYPE_COUNT
};
typedef FS_FILETYPE FSFileType;

#ifdef __cplusplus
struct FSFileTypeEnum : util::Reflection<FSFileTypeEnum, FSFileType> {
    
    static bool isValid(long value)
    {
        return (unsigned long)value < FS_FILETYPE_COUNT;
    }
    
    static const char *prefix() { return "FS_FILETYPE"; }
    static const char *key(FSFileType value)
    {
        switch (value) {
                
            case FS_FILETYPE_DEL:    return "DEL";
            case FS_FILETYPE_SEQ:    return "SEQ";
            case FS_FILETYPE_PRG:    return "PRG";
            case FS_FILETYPE_USR:    return "USR";
            case FS_FILETYPE_REL:    return "REL";
            case FS_FILETYPE_COUNT:  return "???";
        }
        return "???";
    }
};
#endif

enum_long(FS_BLOCKTYPE)
{
    FS_BLOCKTYPE_UNKNOWN,
    FS_BLOCKTYPE_BAM,
    FS_BLOCKTYPE_DIR,
    FS_BLOCKTYPE_DATA,
    FS_BLOCKTYPE_COUNT
};
typedef FS_BLOCKTYPE FSBlockType;

#ifdef __cplusplus
struct FSBlockTypeEnum : util::Reflection<FSBlockTypeEnum, FSBlockType> {
    
    static bool isValid(long value)
    {
        return (unsigned long)value < FS_BLOCKTYPE_COUNT;
    }
    
    static const char *prefix() { return "FS_BLOCKTYPE"; }
    static const char *key(FSBlockType value)
    {
        switch (value) {
                
            case FS_BLOCKTYPE_UNKNOWN:  return "UNKNOWN";
            case FS_BLOCKTYPE_BAM:      return "BAM";
            case FS_BLOCKTYPE_DIR:      return "DIR";
            case FS_BLOCKTYPE_DATA:     return "DATA";
            case FS_BLOCKTYPE_COUNT:    return "???";
        }
        return "???";
    }
};
#endif

enum_long(FS_USAGE)
{
    FS_USAGE_UNKNOWN,
    FS_USAGE_UNUSED,
    FS_USAGE_DOS_VERSION,
    FS_USAGE_DOS_TYPE,
    FS_USAGE_ALLOCATION_BITS,
    FS_USAGE_DISK_ID,
    FS_USAGE_DISK_NAME,
    FS_USAGE_TRACK_LINK,
    FS_USAGE_SECTOR_LINK,
    FS_USAGE_FIRST_FILE_TRACK,
    FS_USAGE_FIRST_FILE_SECTOR,
    FS_USAGE_FIRST_REL_TRACK,
    FS_USAGE_FIRST_REL_SECTOR,
    FS_USAGE_FIRST_DIR_TRACK,
    FS_USAGE_FIRST_DIR_SECTOR,
    FS_USAGE_FILE_TYPE,
    FS_USAGE_FILE_NAME,
    FS_USAGE_FILE_LENGTH_LO,
    FS_USAGE_FILE_LENGTH_HI,
    FS_USAGE_REL_RECORD_LENGTH,
    FS_USAGE_GEOS,
    FS_USAGE_DATA,
    FS_USAGE_COUNT
};
typedef FS_USAGE FSUsage;

#ifdef __cplusplus
struct FSUsageEnum : util::Reflection<FSUsageEnum, FSUsage> {
    
    static bool isValid(long value)
    {
        return (unsigned long)value <= FS_BLOCKTYPE_DATA;
    }
    
    static const char *prefix() { return "FS_USAGE"; }
    static const char *key(FSUsage value) { return "???"; }
};
#endif


//
// Structures
//

typedef struct
{
    Track t;
    Sector s;
}
TSLink;

typedef struct
{
    long bitmapErrors;
    long corruptedBlocks;
    long firstErrorBlock;
    long lastErrorBlock;
}
FSErrorReport;
