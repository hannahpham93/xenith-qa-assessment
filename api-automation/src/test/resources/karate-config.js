function fn() {
  var env = karate.env || 'demoqa';
  karate.log('karate.env system property was:', env);

  var config = {
    env: env,
    // No secrets here: demoqa.com is a public demo API and baseUrl is not
    // sensitive. Same BASE_URL variable as the Playwright suite; -DbaseUrl
    // still wins for one-off runs.
    baseUrl: karate.properties['baseUrl'] || java.lang.System.getenv('BASE_URL') || 'https://demoqa.com',
    // Policy-compliant password for throwaway test users - not a real
    // credential. Overridable via env var, same as the Playwright suite.
    password: java.lang.System.getenv('TEST_USER_PASSWORD') || 'Test@1234!',
    // Expected error bodies shared by every feature.
    errors: {
      unauthorized: { code: '1200', message: 'User not authorized!' },
      failedLogin: { token: null, expires: null, status: 'Failed', result: 'User authorization failed.' },
    },
  };

  // Shared by every feature: a helper that creates a logged-in user, and a
  // hook that deletes the scenario's users afterwards, pass or fail.
  config.createUser = karate.read('classpath:bookstore/features/common/create-user.feature');
  karate.configure('afterScenario', karate.read('classpath:bookstore/features/common/cleanup-users.js'));

  karate.configure('connectTimeout', 15000);
  karate.configure('readTimeout', 15000);

  return config;
}
