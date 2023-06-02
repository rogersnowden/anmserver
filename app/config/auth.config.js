module.exports = {
  secret: "the rain in Spain, etc",
  //jwtExpiration: 1000 * 60 * 60,        // 1 hour
  jwtExpiration: '6000',        // test unit
  jwRefreshExpiration: 8400,  // 24 hour
  
  // jwtExpiration: 60,   // test 1 minute
  // jwtExpiration: 120,  // test, 2 minutes
 
};