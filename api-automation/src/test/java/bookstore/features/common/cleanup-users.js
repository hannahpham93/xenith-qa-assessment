// Global afterScenario hook (set in karate-config.js): deletes the users a
// scenario stored in `user` / `otherUser`, whether it passed or failed.
// Convention: a scenario that creates a user keeps it in one of these names.
function cleanupUsers() {
  ['user', 'otherUser'].forEach(function(name) {
    var u = karate.get(name);
    if (u && u.userId) {
      karate.call('classpath:bookstore/features/common/delete-user.feature', u);
    }
  });
}
