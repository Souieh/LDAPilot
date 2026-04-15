export interface ACE {
  type: 'ALLOW' | 'DENY' | 'OTHER';
  flags: number;
  mask: number;
  sid: string;
  inherited: boolean;
}

export interface SecurityDescriptor {
  revision: number;
  control: number;
  ownerSid?: string;
  groupSid?: string;
  dacl?: ACE[];
}

export function sidToString(input: Buffer | Uint8Array): string {
  if (!input) return '';
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buffer.length < 8) return '';
  const revision = buffer.readUInt8(0);
  const subAuthorityCount = buffer.readUInt8(1);
  const identifierAuthority = buffer.readUIntBE(2, 6);

  let sid = `S-${revision}-${identifierAuthority}`;
  for (let i = 0; i < subAuthorityCount; i++) {
    const subAuthority = buffer.readUInt32LE(8 + i * 4);
    sid += `-${subAuthority}`;
  }
  return sid;
}

export function parseSecurityDescriptor(input: Buffer | Uint8Array): SecurityDescriptor {
  if (!input) throw new Error('Invalid Security Descriptor buffer');
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);

  if (buffer.length < 20) {
    throw new Error('Invalid Security Descriptor buffer');
  }

  // Revision (1 byte)
  const revision = buffer.readUInt8(0);
  // Sbz1 (1 byte)
  // Control (2 bytes)
  const control = buffer.readUInt16LE(2);
  // Offset to Owner (4 bytes)
  const ownerOffset = buffer.readUInt32LE(4);
  // Offset to Group (4 bytes)
  const groupOffset = buffer.readUInt32LE(8);
  // Offset to Sacl (4 bytes)
  // const saclOffset = buffer.readUInt32LE(12);
  // Offset to Dacl (4 bytes)
  const daclOffset = buffer.readUInt32LE(16);

  let ownerSid: string | undefined;
  if (ownerOffset > 0 && ownerOffset < buffer.length) {
    ownerSid = parseSid(buffer.slice(ownerOffset));
  }

  let groupSid: string | undefined;
  if (groupOffset > 0 && groupOffset < buffer.length) {
    groupSid = parseSid(buffer.slice(groupOffset));
  }

  let dacl: ACE[] | undefined;
  if (daclOffset > 0 && daclOffset < buffer.length) {
    dacl = parseAcl(buffer.slice(daclOffset));
  }

  return { revision, control, ownerSid, groupSid, dacl };
}

function parseSid(buffer: Buffer): string {
  return sidToString(buffer);
}

function parseAcl(buffer: Buffer): ACE[] {
  // ACL Revision (1 byte)
  // const revision = buffer.readUInt8(0);
  // Sbz1 (1 byte)
  // ACL Size (2 bytes)
  // const aclSize = buffer.readUInt16LE(2);
  // AceCount (2 bytes)
  const aceCount = buffer.readUInt16LE(4);
  // Sbz2 (2 bytes)

  const aces: ACE[] = [];
  let offset = 8;
  for (let i = 0; i < aceCount; i++) {
    if (offset + 4 > buffer.length) break;

    // ACE Type (1 byte)
    const aceType = buffer.readUInt8(offset);
    // ACE Flags (1 byte)
    const aceFlags = buffer.readUInt8(offset + 1);
    // ACE Size (2 bytes)
    const aceSize = buffer.readUInt16LE(offset + 2);

    if (offset + aceSize > buffer.length) break;

    // Mask (4 bytes)
    const mask = buffer.readUInt32LE(offset + 4);
    // SID (starts at offset + 8)
    const sid = parseSid(buffer.slice(offset + 8));

    let type: ACE['type'] = 'OTHER';
    if (aceType === 0x00) type = 'ALLOW';
    else if (aceType === 0x01) type = 'DENY';

    aces.push({
      type,
      flags: aceFlags,
      mask,
      sid,
      inherited: (aceFlags & 0x10) !== 0,
    });

    offset += aceSize;
  }
  return aces;
}

export function getRightsFromMask(mask: number): string[] {
  const rights: string[] = [];
  if (mask & 0x80000000) rights.push('Generic Read');
  if (mask & 0x40000000) rights.push('Generic Write');
  if (mask & 0x20000000) rights.push('Generic Execute');
  if (mask & 0x10000000) rights.push('Generic All');
  if (mask & 0x000F0000) rights.push('Full Control');
  if (mask & 0x00020000) rights.push('Write');
  if (mask & 0x00010000) rights.push('Read');
  if (mask & 0x00000001) rights.push('Create Child');
  if (mask & 0x00000002) rights.push('Delete Child');
  if (mask & 0x00000004) rights.push('List Children');
  if (mask & 0x00000008) rights.push('Self Write');
  if (mask & 0x00000010) rights.push('Read Property');
  if (mask & 0x00000020) rights.push('Write Property');
  if (mask & 0x00000040) rights.push('Delete Tree');
  if (mask & 0x00000080) rights.push('List Object');
  if (mask & 0x00010000) rights.push('Delete');
  if (mask & 0x00020000) rights.push('Read Permissions');
  if (mask & 0x00040000) rights.push('Change Permissions');
  if (mask & 0x00080000) rights.push('Take Ownership');
  return rights.length > 0 ? rights : [`Unknown (0x${mask.toString(16)})`];
}
