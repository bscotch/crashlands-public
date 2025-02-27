# Crashlands Campaign File: Public Documentation

The [Crashlands](https://www.bscotch.net/games/crashlands) "campaign file" is a bespoke binary file describing the campaign world. A lot of that content is really only useful for developers and the game itself, but there are parts of it that may be useful for wikis, community mods (not officially supported!), and general interest.

This document provides some (incomplete) guidance on how to read the Crashlands campaign file.

## Campaign Game Content

_See the [license](../LICENSE.md) for what you're allowed to do with the game content provided in this repo!_

Campaign files describe how game content relates to other game content, and defines some kinds of assets completely (e.g. NPCs), but does not provide full definitions for all assets. For example, campaign files may refer to the unique IDs of various items that get dropped by a boss fight, or upon completion of a quest, but do not have information about what those items actually _are_.

We've provided [an index](./content/index.json) describing most of that content, along with [thumbnail images of game assets](./content/), which can be used in combination with campaign file data to match unique identifiers to images, names, descriptions, and other details.

The index file includes:

- Numeric identifier (`idx`) values for creatures, items, etc.
- Listing of which images are associated with any given asset.
- Names and descriptions of each asset.

## Sample Parser

If you have [Node.js 20+](https://nodejs.org/en) you can run the [sample parser](./crashlands-campaign-to-json.mjs) on a Crashlands Campaign file to get its contents in (relatively) human readable JSON format. You can use that parser as a starting point for your own exploration of the format!

To run it, you'll need to feed it the location of a campaign file and an output location for the created JSON file. Assuming you have a terminal open in the directory containing the script, the command would look something like this:

`node crashlands-campaign-to-json.mjs path/to/campain_hardfile path/to/output.json`

## Definitions

- **Campaign File:** A file shipped with the game describing all characters, quests, outpost locations, etc. Basically the file that describes the game world.
- **Bit:** A representation of a value that can have two states, typically represented as `1` and `0`. But they can be interpeted as `true`/`false`, `on`/`off`, etc.
- **Byte:** 8 bits in a row make up a byte. Any file is just a long sequence of bytes.
- **Encoding:** The instructions for how to interpret a sequence of bytes. Any given byte doesn't have an inherent meaning -- meaning is dictated by the software reading and writing those bytes. For example, the byte `01100001` could mean the letter `a` if you interpret it as text, or the `97` if you interpret it as a base-10 integer.
- **Whatbyte:** In the Campaign File, certain bytes are referred to as "whatbytes" if they serve as a milestone and indicate what kind of data comes next (it's a "byte" telling us "what" follows). For example, the first whatbyte is expected to be the value `1`. In addition to indicating when we're changing from one type of content to another, whatbytes are used to infer file corruption (e.g. if we expect the byte to be a certain whatbyte, but get a different value instead, then something is wrong with the file or the parser). Whatbytes are sometimes represented as an ASCII character, e.g. `a` instead of `97`.
- **String:** A sequence of bytes that can be interpreted as text is a "string". All strings in the campaign file end with a "null" byte (`00000000`), so strings can be read by grabbing each byte until you hit a null byte.
- **Integer:** A sequence of bytes of some known length, interpreted as an integer value. For example, an 8-bit (1 byte) integer, 16-bit (2 byte) integer, and so on.
- **Signed/Unsigned Integer:** An integer can either allow negatives ("signed") or only positives ("unsigned"). These are typically named like `s8` (8-bit signed integer) or `u32` (32-bit unsigned integer)
- **Outpost:** In Crashlands the base world is randomly generated. "Outposts" are non-random, designed locations scattered around the world. These are how characters/villages/bossfights/etc are placed. Outposts also change over time, triggered by quests. These changes are represented by "stages", each of which is a delta from the prior stage.

## Campaign File Location

When you install Crashlands you end up with a bunch of files in the installation folder (with a Steam install on Windows that'd be something like `C:\program files (x86)\Steam\steamapps\common\Crashlands`). Inside that folder you'll see a collection of files named exactly, or starting with, `campaign_hardfile`. You'll see one for each kind of campaign. The one without a prefix is the main one used for regular gameplay.

If you open this file up in a plain text editor (like Notepad or VS Code) you'll see a lot of plaintext content, plus a lot of indecipherable stuff. You'll need a binary or hex editor to make sense of the rest, but it won't be easy! If you understand the encoding, you can also write a program to read the binary file and convert it into something that you _can_ read.

## Campaign File Encoding

The following is a rough description of the campaign file's content. It may not be exactly correct, so please report any errors you find!

Encoding is listed as `name (type)` followed by a description. For repeating content we start with a count, and then a sublist of what that repeated content consists of. Some items look like `name (type/number)`, which means that the value is normalized in some way before use. For example, `probability` (`u8`/200) means that the probability is stored as a U8 but that value is divided by 200 before it is used. Many such values have a max allowed value smaller than the range of the storage type (the same `probability` value has a max of `200`, for example). These are not generally listed.

1. `HASH` (`string`): The file's hash. This is a hash of the file content so that the game can detect file corruption (the hash in the file is checked against the computed hash).
2. `whatbyte` (`u8`): `1`
3. `CAMPAIGN_IDX` (`u32`): The numeric ID of the campaign type
4. `CAMPAIGN_VERSION` (`u16`): The numeric version of the campaign (how many edits it has had)
5. `CAMPAIGN_CHANNEL` (`u8`): Whether this is a beta or production campaign version (for internal use)
6. `CAMPAIGN_NAME` (`string`): The campaign name
7. `CAMPAIGN_FLAGS` (`u32`): A sequence of bit flags representing misc. global options
8. `INITIAL_BIOME` (`u8`): _(legacy, unused)_
9. `FLUX_NAME` (`string`): "Flux"
10. `JUICEBOX_NAME` (`string`): "Juicebox"
11. `whatbyte` (`u8`): `a`
12. `AUTHOR_COUNT` (`u8`): The number of authors that follow
    - `AUTHOR` (`u32`): Author BscotchID number
13. `whatbyte` (`u8`): `t`
14. `TESTER_COUNT` (`u8`): The number of authors that follow
    - `TESTER` (`u32`): Tester BscotchID number _(legacy)_
15. `whatbyte` (`u8`): `101`
16. `NPC_COUNT` (`u16`): Number of NPC definitions that follow
    - `name` (`string`): Unique name
    - `idx` (`u32`): Unique numeric identifier, used in quests etc
    - `species` (`u8`): The numeric index for the NPCs species type
    - `head` (`u8`): For species with multiple head options
    - `head_size` (`u8`): Head scale
    - `head_r` (`u8`): Red tinting for the head
    - `head_g` (`u8`): Green tinting for the head
    - `head_b` (`u8`): Blue tinting for the head
    - `body` (`u8`): (Same idea as the head options)
    - `body_size` (`u8`)
    - `body_r` (`u8`)
    - `body_g` (`u8`)
    - `body_b` (`u8`)
    - `flags` (`u16`): Configuration flags
    - `whatbyte` (`u8`): 111
    - `idle_dialogue_count` (`u8`): Total idle dialogues that follow
      - `idle_dialogue` (`string`): A line of idle dialogue
17. `whatbyte` (`u8`): `113`
18. `BOSSFIGHT_COUNT` (`u16`): Total bossfights
    - `idx` (`u32`): unique bossfight identifier
    - `name` (`string`)
    - `boss` (`u8`): bosstype index
    - `flags` (`u16`)
    - `hp_start` (`u8`/200)
    - `hp_end` (`u8`/200)
    - `hp_multiplier` (`u8`/50)
    - `dmg_multiplier` (`u8`/50)
    - `whatbyte` (`u8`): `123`
    - `loot_group_count` (`u8`): Total loot groups
      - `quantity` (`u8`)
      - `probability` (`u8`/200)
      - `whatbyte` (`u8`): `110`
      - `loot_count` (`u8`)
        - `item` (`u16`): loot item numeric index
        - `item_metadata` (`u8`)
        - `weight` (`u8`)
    - `whatbyte` (`u8`): `143`
    - `phase_count` (`u8`): Total phases in the fight
      - `hp` (`u8`/200)
      - `speed_multiplier` (`u8`/50)
      - (The next 16 values are for each of the bosses "moves", each of which has a numeric index. There are always 16 weights, even though most are 0)
        - `move_weight` (`u8`)
      - `whatbyte` (`u8`): `153`
      - `dialogue_count` (`u8`): Total number of dialogues during this phase of the fight
        - `character_idx` (`u32`): Which character speaks the dialogue
        - `dialogue` (`string`): The dialogue line
19. `whatbyte` (`u8`): `102`
20. `OUTPOST_COUNT` (`u16`): Total outpost definitions that follow
    - `idx` (`u32`): Numeric identifier for the outpost
    - `name` (`string`)
    - `biome` (`u8`)
    - `position1` (`s16`) // cartesian x (tiles), radial r (seconds)
    - `position2` (`s16`) // cartesian y (tiles), radial theta (degrees)
    - `variation1` (`s16`) // cartesian x_max (tiles), radial r_max (seconds)
    - `variation2` (`s16`) // cartesian y_max (tiles), radial plus/minus_theta (degrees)
    - `info_flag` (`u16`)
    - `relative_to` (`u32`)
    - `whatbyte` (`u8`): `112`
    - `stage_count` (`u8`): Total number of stages in this outpost
      - `idx` (`u16`)
      - `name` (`string`)
      - `whatbyte` (`u8`): `122`
      - `tile_count` (`u16`): Total number of tiles described after
        - `x_coord` (`s8`)
        - `y_coord` (`s8`)
        - `tile` (`s16`): Which tile is at this location
      - `whatbyte` (`u8`): `132`
      - `item_count` (`u16`): Total number of items described after
        - `x_coord` (`s8`)
        - `y_coord` (`s8`)
        - `item` (`s16`): Which item is at this location
      - `whatbyte` (`u8`): `142`
      - `creature_count` (`u16`): Total number of creatures described after
        - `x_coord` (`s8`)
        - `y_coord` (`s8`)
        - `creature` (`s8`): Which creature is at this location
        - `size` (`u8`): The creature's size
      - `whatbyte` (`u8`): `152`
      - `npc_count` (`u16`): Total number of NPCs described after
        - `x_coord` (`s8`)
        - `y_coord` (`s8`)
        - `npc` (`u32`): Which NPC is at this location
      - `whatbyte` (`u8`): `162`
      - `bossfight_count` (`u16`): Total number of Bossfights described after
        - `x_coord` (`s8`)
        - `y_coord` (`s8`)
        - `bossfight` (`u32`): Which Bossfight is at this location
      - `whatbyte` (`u8`): `172`
      - `chest_count` (`u16`): Total number of Chests described after
        - `x_coord` (`s8`)
        - `y_coord` (`s8`)
        - `chest` (`s16`): Which Chest is at this location
        - `whatbyte` (`u8`): `182`
        - `loot_group_count` (`u8`)
          - `quantity` (`u8`)
          - `probability` (`u8`/200)
          - `whatbyte` (`u8`): `192`
          - `loot_count` (`u8`)
            - `item` (`u16`) // index
            - `item_metadata` (`u8`) // boolean
            - `weight` (`u8`) // arbitrary integer from 0-255
21. `whatbyte` (`u8`): `106`
22. `STORY_COUNT` (`u16`): Total number of story definitions that follow
    - `idx` (`u32`): Story ID, referenced in quests
    - `name` (`string`): Story name as shown in game
    - `rank` (`u16`): _(unused)_
    - `priority` (`u8`): Whether this takes priority over other stories
23. `whatbyte` (`u8`): `105`
24. `QUEST_COUNT` (`u16`): Total number of quest definitions that follow
    - `idx` (`u32`): Quest ID, referenced in other quests
    - `name` (`string`): quest name
    - `giver` (`u32`): quest giver NPC id (0 = noone, 1=JB)
    - `receiver` (`u32`): quest receiver NPC id (0 = noone, 1=JB)
    - `flags` (`u32`)
    - `story` (`u32`): story id
    - `whatbyte` (`u8`): `115`
    - `initial_dialog_count` (`u8`)
      - `speaker` (`u32`): NPC id
      - `dialogue` (`string`)
    - `whatbyte` (`u8`): `116`
    - `incompletion_dialog_count` (`u8`)
      - `speaker` (`u32`): NPC id
      - `dialogue` (`string`)
    - `whatbyte` (`u8`): `117`
    - `completion_dialog_count` (`u8`)
      - `speaker` (`u32`): NPC id
      - `dialogue` (`string`)
    - `whatbyte` (`u8`): `118`
    - `required_perk_count` (`u8`): Required Perks
      - `perk_id` (`u16`)
    - `whatbyte` (`u8`): `119`
    - `required_quest_count` (`u8`)
      - `quest` (`u32`)
      - `completion` (`u8`): 0→can just be active, 1→must be complete
    - (REWARDS: repeat for on-accept and on-complete events, with starting `whatbyte` of `120` and `121` respectively)
      - `reward_count` (`u8`)
        - `reward_type` (`u8`): 0→get an item; 1→Get a recipe; 2→track recipe; 3→Q kills NPC; 4→Outpost map visibility
        - `reward` (`u32`): 0→item_idx; 1→item_idx; 2→item_idx; 3→npc_id; 4→outpost_id; 6→Weapon/Armor
        - `reward_extra` (`u8`): 0→quantity; 1→NA; 2→NA; 3→NA; 4→[0=invisible,1=visible]; 6→Weapon/Armor Quality
    - (TRANSITIONS: repeat for on-accept and on-complete events, with starting `whatbyte` of `122` and `123` respectively)
      - `transition_count` (`u8`)
        - `outpost` (`u32`): outpost id
        - `stage_id` (`u16`): stage id
        - `transition_method` (`u8`)
    - (HEWGO DESTROYS THING: repeat for on-accept and on-complete events, with starting `whatbyte` of `126` and `127` respectively)
      - `destroy_count` (`u8`)
        - `item_idx` (`u16`)
        - `in_outpost` (`u32`)
    - `whatbyte` (`u8`): `125`
    - `task_count` (`u8`): Number of task definitions that follow
      - `type` (`u8`): This task's type, which dictates how the next bytes are read
      - if `type` is `0`
        - `creature` (`u8`)
        - `creature_size` (`u8`)
        - `in_outpost` (`u32`)
        - `quantity` (`u8`)
      - if `type` is `1`
        - `item` (`u16`)
        - `quantity` (`u8`)
      - if `type` is `2`
        - `item` (`u16`)
        - `quantity` (`u8`)
        - `in_outpost` (`u32`)
      - if `type` is `3`
        - `item` (`u16`)
        - `quantity` (`u8`)
        - `in_outpost` (`u32`)
      - if `type` is `5`
        - `item` (`u16`)
        - `quantity` (`u8`)
        - `in_outpost` (`u32`)
      - if `type` is `6`
        - `item` (`u16`)
        - `quantity` (`u8`)
      - if `type` is `7`
        - `resource_item` (`u16`)
        - `loot_prob` (`u8`) // divided by 200
        - `in_outpost` (`u32`)
        - `loot_item` (`u16`)
        - `loot_qty` (`u8`)
      - if `type` is `8`
        - `creature` (`u8`)
        - `creature_size` (`u8`)
        - `in_outpost` (`u32`)
        - `loot_prob` (`u8`) // divided by 200
        - `loot_item` (`u16`)
        - `loot_qty` (`u8`)
      - if `type` is `9`
        - `creature` (`u8`)
        - `creature_size` (`u8`)
      - if `type` is `10`
        - `creature` (`u8`)
        - `creature_size` (`u8`)
        - `name` (`string`)
        - `prob` (`u8`) // divided by 200
        - `in_outpost` (`u32`)
      - if `type` is `12`
        - `seconds` (`u16`)
      - if `type` is `13`
        - `in_outpost` (`u32`)
        - `stage_id` (`s16`) // -1 means "any stage"
        - `outpost_x` (`s8`) // (0,0) means "any coord"
        - `outpost_y` (`s8`) // negated value
      - if `type` is `14`
        - `bossfight` (`u32`)
      - if `type` is `15`
        - `nighttime` (`u8`) // boolean
      - if `type` is `16`
        - `item` (`u16`)
        - `quantity` (`u8`)

