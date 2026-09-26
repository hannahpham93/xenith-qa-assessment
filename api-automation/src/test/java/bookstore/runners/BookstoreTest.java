package bookstore.runners;

import com.intuit.karate.junit5.Karate;

/**
 * Runs every feature under bookstore/features (helpers tagged @ignore are
 * skipped). Filter by priority with e.g. -Dkarate.options="--tags @P0".
 */
class BookstoreTest {

    @Karate.Test
    Karate testBookstoreApi() {
        return Karate.run("classpath:bookstore/features");
    }
}
