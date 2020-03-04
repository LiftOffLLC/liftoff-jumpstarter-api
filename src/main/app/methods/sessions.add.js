/**
Note if you are using cache...set the async to TRUE always.
*/
module.exports = {
  name: 'sessionsAdd',
  description: 'Adds the object to sessions',
  enabled: true,
  async: true,
  method: async (id, subject) => {
    const returnValue = {
      id,
      subject,
    };
    return returnValue;
  },
  options: {
    generateKey: id => id,
  },
};
