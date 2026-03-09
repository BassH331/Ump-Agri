// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use("campusMap");

// Find a document in a collection.
db.getCollection("users").findOne({ 
    "email": "222147008@ump.ac.za"
});
