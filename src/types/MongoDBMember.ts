export interface MongoDBMember {
  _id: {
    $oid: string,
  },
  memberId: string,
  coins: number,
  roles: Array<{
    guildId: string,
    roleId: string,
    expiryDate: number,
  }>,
  __v: number,
  exp: number,
  level: number,
  rooms: Array<string>,
}
