import fs from "node:fs";

// Use the first argument as the file name to look for
const inputCampaignFilePath = process.argv[2];
const outputCampaignFilePath = process.argv[3];

// Get the raw bytes of the campaign file
const campaign_file = fs.readFileSync(inputCampaignFilePath);
let offset = 0; // Position in the file as we read it

const campaign = {
  hash: assertNextWhatbyteAfter(readString(), 1),
  metadata: {
    idx: readU32(),
    version: readU16(),
    channel: readU8(),
    name: readString(),
    flags: readU32(),
    biome: readU8(),
    flux: readString(),
    juicebox: assertNextWhatbyteAfter(readString(), "a"),
    authors: assertNextWhatbyteAfter(forCount(readU8(), readU32), "t"),
    testers: assertNextWhatbyteAfter(forCount(readU16(), readU32), 101),
  },
  npcs: assertNextWhatbyteAfter(
    forCount(readU16(), () => {
      return {
        name: readString(),
        idx: readU32(),
        species: readU8(),
        head: {
          type: readU8(),
          size: readU8(),
          r: readU8(),
          g: readU8(),
          b: readU8(),
        },
        body: {
          type: readU8(),
          size: readU8(),
          r: readU8(),
          g: readU8(),
          b: readU8(),
        },
        flags: assertNextWhatbyteAfter(readU16(), 111),
        idles: forCount(readU8(), readString),
      };
    }),
    113
  ),
  bossfights: assertNextWhatbyteAfter(
    forCount(readU16(), () => {
      // - `idx` (`u32`): unique bossfight identifier
      // - `name` (`string`)
      // - `boss` (`u8`): bosstype index
      // - `flags` (`u16`)
      // - `hp_start` (`u8`/200)
      // - `hp_end` (`u8`/200)
      // - `hp_multiplier` (`u8`/50)
      // - `dmg_multiplier` (`u8`/50)
      // - `whatbyte` (`u8`): `123`
      // - `loot_group_count` (`u8`): Total loot groups
      //   - `quantity` (`u8`)
      //   - `probability` (`u8`/200)
      //   - `whatbyte` (`u8`): `110`
      //   - `loot_count` (`u8`)
      //     - `item` (`u16`): loot item numeric index
      //     - `item_metadata` (`u8`)
      //     - `weight` (`u8`)
      // - `whatbyte` (`u8`): `143`
      // - `phase_count` (`u8`): Total phases in the fight
      //   - `hp` (`u8`/200)
      //   - `speed_multiplier` (`u8`/50)
      //   - (The next 16 values are for each of the bosses "moves", each of which has a numeric index. There are always 16 weights, even though most are 0)
      //     - `move_weight` (`u8`)
      //   - `whatbyte` (`u8`): `153`
      //   - `dialogue_count` (`u8`): Total number of dialogues during this phase of the fight
      //     - `character_idx` (`u32`): Which character speaks the dialogue
      //     - `dialogue` (`string`): The dialogue line
      return {
        idx: readU32(),
        name: readString(),
        boss: readU8(),
        flags: readU16(),
        hp_start: readU8() / 200,
        hp_end: readU8() / 200,
        hp_multiplier: readU8() / 50,
        dmg_multiplier: assertNextWhatbyteAfter(readU8() / 50, 123),
        loot_groups: assertNextWhatbyteAfter(
          forCount(readU8(), () => {
            return {
              quantity: readU8(),
              probability: assertNextWhatbyteAfter(readU8() / 200, 110),
              loot: forCount(readU8(), () => {
                return {
                  item: readU16(),
                  item_metadata: readU8(),
                  weight: readU8(),
                };
              }),
            };
          }),
          143
        ),
        phases: forCount(readU8(), () => {
          return {
            hp: readU8() / 200,
            speed_multiplier: readU8() / 50,
            moves: assertNextWhatbyteAfter(
              forCount(16, () => {
                return readU8();
              }),
              153
            ),
            dialogues: forCount(readU8(), () => {
              return {
                character_idx: readU32(),
                dialogue: readString(),
              };
            }),
          };
        }),
      };
    }),
    102
  ),
};

fs.writeFileSync(outputCampaignFilePath, JSON.stringify(campaign, null, "\t"));

//#region UTILITIES
function readU8() {
  return nextByte();
}
function readU16() {
  const value = campaign_file.readUint16LE(offset);
  offset += 2;
  return value;
}
function readU32() {
  const value = campaign_file.readUint32LE(offset);
  offset += 4;
  return value;
}
/**
 * @param {number} count
 * @param {(idx:number)=>any} generator
 * @returns
 */
function forCount(count, generator) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(generator(i));
  }
  return results;
}

function readString() {
  let bytes = [];
  while (true) {
    const byte = nextByte();
    if (byte === 0) {
      break;
    }
    bytes.push(byte);
  }
  return new TextDecoder().decode(Uint8Array.from(bytes));
}
/**
 * @param {string|number} expected
 */
function assertNextWhatbyte(expected) {
  const actual = nextByte();
  if (typeof expected === "string") {
    expected = expected.charCodeAt(0);
  }
  assertEquals(
    actual,
    expected,
    `Expected whatbyte ${expected} but got ${actual}`
  );
}

/**
 * Return the first value after asserting the next whatbyte.
 * Useful for reading the value right before a whatbyte, in
 * particular in an object context.
 * @param {any} value
 * @param {number|string} whatbyte
 */
function assertNextWhatbyteAfter(value, whatbyte) {
  assertNextWhatbyte(whatbyte);
  return value;
}

function nextByte() {
  return campaign_file[offset++];
}

/**
 * @param {any} a
 * @param {any} b
 * @param {string} message
 */
function assertEquals(a, b, message) {
  assert(a === b, message || `Expected ${a} to equal ${b}`);
}
/**
 * @param {any} claim
 * @param {string} message
 */
function assert(claim, message) {
  if (!claim) {
    throw message || "Assertion failed";
  }
}
/**
 * @template T
 * @param {T} value
 * @returns {Exclude<T, undefined | null>}
 */
function defined(value) {
  // @ts-ignore
  assert([undefined, null].includes(value) === false, "Value is not defined");
  // @ts-ignore
  return value;
}
//#endregion
