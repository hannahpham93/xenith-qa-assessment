function fn() {
  var env = karate.env || 'demoqa';
  karate.log('karate.env system property was:', env);

  var config = {
    env: env,
    // No secrets here: demoqa.com is a public demo API and baseUrl is not
    // sensitive. If this suite ever pointed at a real environment, the
    // baseUrl (and any credentials) would come from environment
    // variables / a CI secret store instead of being hard-coded.
    baseUrl: karate.properties['baseUrl'] || 'https://demoqa.com',
  };

  karate.configure('connectTimeout', 15000);
  karate.configure('readTimeout', 15000);

  return config;
}
