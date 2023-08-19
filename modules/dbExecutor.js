//Database connection module with integrated error treatment
module.exports = class dbExecutor {
    constructor(dbClient, renderer) {
        this.dbClient = dbClient;
        this.renderer = renderer;

        //Define frequently used querys
        this.criticsByIsbnQuery = 'SELECT * FROM "critics" critics JOIN "users" users ON critics.user=users.id AND "isbn"=$1';
        this.bookByIsbnQuery = 'SELECT * FROM "books" WHERE "ISBN"=$1';
        this.searchBooksQuery = 'SELECT * FROM "books" WHERE LOWER("ISBN") LIKE $1 OR LOWER("title") LIKE $1 OR LOWER("author") LIKE $1';
        this.getUsersByNameQuery = 'SELECT * FROM "users" WHERE "username"=$1';
        this.getUsersQuery = 'SELECT * FROM "users" WHERE "id"=$1';

        //Define error treatment modes
        this.PUG = 0;
        this.JSON = 1;
    }

    //Query for critics to display by parameter isbn with additional error treatment
    getCriticsByIsbnWithError(isbn, res, page, data, callback) {
        this.queryWithError(this.criticsByIsbnQuery, [isbn], res, page, data, callback);
    }

    //Query DB for book by parameter isbn with additional error treatment
    getBookByIsbnWithError(isbn, res, page, data, callback) {
        this.queryWithError(this.bookByIsbnQuery, [isbn], res, page, data, callback);
    }

    //Query database caseinsensitive for book isbn, title or author (query pre-/in-/suffix) with additional error treatment
    searchBooksWithError(term, res, page, data, callback) {
        this.queryWithError(this.searchBooksQuery, ["%" + term.toLowerCase() + "%"], res, page, data, callback);
    }

    //Query database caseinsensitive for book isbn, title or author (query pre-/in-/suffix) with additional error treatment
    searchBooksWithErrorJson(term, res, page, data, callback) {
        this.queryWithErrorExecutor(this.searchBooksQuery, ["%" + term.toLowerCase() + "%"], res, page, data, this.JSON, callback);
    }

    //Query database for username with additional error treatment
    getUsersByNameWithError(username, res, page, data, callback) {
        this.queryWithError(this.getUsersByNameQuery, [username], res, page, data, callback);
    }

    //Query database for user id with additional error treatment
    getUsersWithError(userID, res, page, data, callback) {
        this.queryWithError(this.getUsersQuery, [userID], res, page, data, callback);
    }

    //Default query without any treatment
    query(query, queryArr, callback) {
        this.dbClient.query(query, querryArr, callback);
    }

    //Default query with error treatment (convinience method)
    queryWithError(query, querryArr, res, page, data, callback) {
        this.queryWithErrorExecutor(query, querryArr, res, page, data, this.PUG, callback);
    }

    //Default query with multiple error treatment capabilities
    queryWithErrorExecutor(query, querryArr, res, page, data, errorMode, callback) {
        let self = this;
        this.dbClient.query(query, querryArr, function (dbError, dbResponse) {
            if (dbError) {
                self.treatDbError(dbError, res, page, data, errorMode);
                return;
            }

            callback(dbResponse);
        });
    }

    //DB Error treatment
    treatDbError(dbError, res, page, data, errorMode) {
        if (errorMode == this.JSON) {
            this.renderer.respondWithErrorDataJson(res, "Database error " + dbError.code, data);
        } else if (errorMode == this.PUG) {
            this.renderer.renderWithErrorData(res, page, "Database error " + dbError.code, data);
        }
    }
}
