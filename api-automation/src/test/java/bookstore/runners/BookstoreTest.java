package bookstore.runners;

import com.intuit.karate.junit5.Karate;

class BookstoreTest {

    @Karate.Test
    Karate testBookstoreFlow() {
        return Karate.run("classpath:bookstore/features/bookstore-flow.feature");
    }
}
