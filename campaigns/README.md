# Campaign File: Public Documentation

The Crashlands "campaign file" is a bespoke binary file describing the campaign world. A lot of that content is really only useful for developers and the game itself, but there are parts of it that may be useful for wikis, community mods (not officially supported!), and general interest.

This document provides some (incomplete) guidance on how to read the Crashlands campaign file.

## Definitions

- **Campaign File:** A file shipped with the game describing all characters, quests, outpost locations, etc. Basically the file that describes the game world.
- **Bit:** A representation of a value that can have two states, typically represented as `1` and `0`. But they can be interpeted as `true`/`false`, `on`/`off`, etc.
- **Byte:** 8 bits in a row make up a byte. Any file is just a long sequence of bytes.
- **Encoding:** The instructions for how to interpret a sequence of bytes. Any given byte doesn't have an inherent meaning -- meaning is dictated by the software reading and writing those bytes. For example, the byte `01100001` could mean the letter `a` if you interpret it as text, or the `97` if you interpret it as a base-10 integer.
- **Whatbyte:** In the Campaign File, certain bytes are referred to as "whatbytes" if they serve as a milestone and indicate what kind of data comes next (it's a "byte" telling us "what" follows). For example, the first whatbyte is expected to be the value `1`. In addition to indicating when we're changing from one type of content to another, whatbytes are used to infer file corruption (e.g. if we expect the byte to be a certain whatbyte, but get a different value instead, then something is wrong with the file or the parser). Whatbytes are sometimes represented as an ASCII character, e.g. `a` instead of `97`.
- **String:** A sequence of bytes that can be interpreted as text is a "string". All strings in the campaign file end with a "null" byte (`00000000`), so strings can be read by grabbing each byte until you hit a null byte.
- **Integer:** A sequence of bytes of some known length, interpreted as an integer value. For example, an 8-bit (1 byte) integer, 16-bit (2 byte) integer, and so on.
- **Signed/Unsigned Integer:** An integer can either allow negatives ("signed") or only positives ("unsigned"). These are typically named like `s8` (8-bit signed integer) or `u32` (32-bit unsigned integer)

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
