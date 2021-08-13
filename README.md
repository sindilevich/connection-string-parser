# Connection String Parser
This project aims to provide a connection string parser/formatter for `node.js` and browser.

# The Need
Mostly, connecting to a database requires to provide some sort of a connection string: a URI that points to one or more database hosts, supplies connection credentials, and allows to further configure the connection via database-specific options.

As an example, here is a `MongoDB` connection string: `mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]`. It nicely combines a large set of database connection information and configuration data into a compact implementation. Let's look at the connection string components:

* Scheme: `mongodb://`
* Credentials: `username:password`
* List of hosts: `host1[:port1][,host2[:port2],...[,hostN[:portN]]]`
* Database name: `database`
* Connection-specific options: `options`

Here is another example, a `MySQL` connection string this time: `mysql://user:password@host:port/db?debug=true&charset=BIG5_CHINESE_CI&timezone=-0700`. It features the same components as the `MongoDB` connection string, and closely resembles all other possible connection strings, expressed as a URI.

Yet the most intriguing part, is that a project creator can invent his own URI-based connection string and use it to convey his project-specific configurations and options as long as they fit a URI concept and format.

Say, developing a project that needs to connect to a `Hazelcast` cluster. Why not require the project consumer to supply the needed connection information: credentials, host(s), options, etc. as a URI-based connection string? Such as the one below: `hazelcast://[user:[password@]]host1[:port1][,host2:[port2],...[,hostN:[portN]]][[/]?options]`.

So, it seems like connection strings are good means to represent connection information and configuration in a compact form. An added value in a connection string is the simplicity with which it can be passed to the consumer: an environmental variable, a command line parameter, a one-liner in a configuration file of some sort.

# The Problem
The problem with a URI-based connection string that immediately arises - is that not every connection provider: database, in-memory cluster, etc. supports connecting to it with a connection string. Many of such tools work with connection objects only. A connection object conveys the represents the same connection information as a connection string, though in JSON format.

Thus, a question emerge: *How to convert a convenient URI-based connection string to a JSON-based connection object?*

# The Solution
Here a generic connection string parser comes to rescue. One that take in a URI-based connection string and parse it into a JSON object. Or take in a JSON-based connection object and format it as a connection string.

And this is the ultimate aim of this project: **A generic connection string parser/formatter**.

# Say No More and How to Use It
The project is written in `Typescript`. Below usage examples for `Typescript`-based projects.

## Add to the project
Simply run `npm install connection-string-parser` in your project's folder.

## Parse
With a connection string as the input, let's convert it to a connection object for further use.

Each component of a connection string **has to be URI-encoded** with the `encodeURIComponent` method or its analogues.

The result connection object will have each component automatically decoded with the `decodeURIComponent` method.

```typescript
import { ConnectionStringParser } from "connection-string-parser";

const connectionStringParser = new ConnectionStringParser({
	scheme: "mongodb",
	hosts: []
});

const connectionObject = connectionStringParser.parse("mongodb://s%23perus%24r:unbr%23k%40bl%24@ho%24t:1234/%24my-db?replicaSet=%24super%40");
```

The code above should yield a connection object with the following information:

```typescript
{
	"scheme": "mongodb",
	"hosts": [{
		"host": "ho$t",
		"port": 1234
	}],
	"username": "s#perus$r",
	"password": "unbr#k@bl$",
	"endpoint": "$my-db",
	"options": {
		"replicaSet": "$super@"
	}
}
```

## Format
With a connection object as the input, let's convert it to a connection string for further use.

The result connection string will have each of its component automatically encoded with the `encodeURIComponent` method.

```typescript
import { ConnectionStringParser } from "connection-string-parser";

const connectionStringParser = new ConnectionStringParser({
	scheme: "mongodb",
	hosts: []
});

const connectionString = connectionStringParser.format({
	"scheme": "mongodb",
	"hosts": [{
		"host": "ho$t",
		"port": 1234
	}],
	"username": "s#perus$r",
	"password": "unbr#k@bl$",
	"endpoint": "$my-db",
	"options": {
		"replicaSet": "$super@"
	}
});
```

The code above should yield a connection string with the following information:

```typescript
"mongodb://s%23perus%24r:unbr%23k%40bl%24@ho%24t:1234/%24my-db?replicaSet=%24super%40"
```

# Acknowledgments
The [mongodb-uri](https://github.com/mongolab/mongodb-uri-node) project.