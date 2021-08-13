// MIT License

// Copyright (c) 2018 Matanel Sindilevich

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

export interface IConnectionStringHost {
	host: string;
	port?: number;
}

export interface IConnectionStringParameters {
	scheme: string;
	username?: string;
	password?: string;
	hosts: IConnectionStringHost[];
	endpoint?: string;
	options?: any;
}

export class ConnectionStringParser {
	private static readonly DEFAULT_SCHEME = "db";

	private readonly scheme: string;

	constructor(options?: IConnectionStringParameters) {
		this.scheme = (options && options.scheme) || ConnectionStringParser.DEFAULT_SCHEME;
	}

	/**
	 * Takes a connection string object and returns a URI string of the form:
	 *
	 * scheme://[username[:password]@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[endpoint]][?options]
	 * @param connectionStringObject The object that describes connection string parameters
	 */
	public format(connectionStringObject?: IConnectionStringParameters) {
		if (!connectionStringObject) {
			return this.scheme + "://localhost";
		}
		if (this.scheme && connectionStringObject.scheme && this.scheme !== connectionStringObject.scheme) {
			throw new Error(`Scheme not supported: ${connectionStringObject.scheme}`);
		}

		let uri = (this.scheme || connectionStringObject.scheme || ConnectionStringParser.DEFAULT_SCHEME) + "://";

		if (connectionStringObject.username) {
			uri += encodeURIComponent(connectionStringObject.username);
			// Allow empty passwords
			if (connectionStringObject.password) {
				uri += ":" + encodeURIComponent(connectionStringObject.password);
			}
			uri += "@";
		}
		uri += this._formatAddress(connectionStringObject);
		// Only put a slash when there is an endpoint
		if (connectionStringObject.endpoint) {
			uri += "/" + encodeURIComponent(connectionStringObject.endpoint);
		}
		if (connectionStringObject.options && Object.keys(connectionStringObject.options).length > 0) {
			uri += "?" + Object.keys(connectionStringObject.options)
				.map((option) => encodeURIComponent(option) + "=" + encodeURIComponent(connectionStringObject.options[option]))
				.join("&");
		}
		return uri;
	}

	/**
	 * Takes a connection string URI of form:
	 *
	 *   scheme://[username[:password]@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[endpoint]][?options]
	 *
	 * and returns an object of form:
	 *
	 *   {
	 *     scheme: string,
	 *     username?: string,
	 *     password?: string,
	 *     hosts: [ { host: string, port?: number }, ... ],
	 *     endpoint?: string,
	 *     options?: object
	 *   }
	 *
	 * Where scheme and hosts will always be present. Other fields will only be present in the result if they were
	 * present in the input.
	 * @param uri The connection string URI
	 */
	public parse(uri: string): IConnectionStringParameters {
		const connectionStringParser = new RegExp(
			"^\\s*" + // Optional whitespace padding at the beginning of the line
			"([^:]+)://" + // Scheme (Group 1)
			"(?:([^:@,/?=&]+)(?::([^:@,/?=&]+))?@)?" + // User (Group 2) and Password (Group 3)
			"([^@/?=&]+)" + // Host address(es) (Group 4)
			"(?:/([^:@,/?=&]+)?)?" + // Endpoint (Group 5)
			"(?:\\?([^:@,/?]+)?)?" + // Options (Group 6)
			"\\s*$", // Optional whitespace padding at the end of the line
			"gi");
		const connectionStringObject = {} as IConnectionStringParameters;

		if (!uri.includes("://")) {
			throw new Error(`No scheme found in URI ${uri}`);
		}

		const tokens = connectionStringParser.exec(uri);

		if (Array.isArray(tokens)) {
			connectionStringObject.scheme = tokens[1];
			if (this.scheme && this.scheme !== connectionStringObject.scheme) {
				throw new Error(`URI must start with '${this.scheme}://'`);
			}
			connectionStringObject.username = tokens[2] ? decodeURIComponent(tokens[2]) : tokens[2];
			connectionStringObject.password = tokens[3] ? decodeURIComponent(tokens[3]) : tokens[3];
			connectionStringObject.hosts = this._parseAddress(tokens[4]);
			connectionStringObject.endpoint = tokens[5] ? decodeURIComponent(tokens[5]) : tokens[5];
			connectionStringObject.options = tokens[6] ? this._parseOptions(tokens[6]) : tokens[6];
		}
		return connectionStringObject;
	}

	/**
	 * Formats the address portion of a connection string
	 * @param connectionStringObject The object that describes connection string parameters
	 */
	private _formatAddress(connectionStringObject: IConnectionStringParameters): string {
		return connectionStringObject.hosts
			.map((address) => encodeURIComponent(address.host) + (address.port ? ":" + encodeURIComponent(address.port.toString(10)) : ""))
			.join(",");
	}

	/**
	 * Parses an address
	 * @param addresses The address(es) to process
	 */
	private _parseAddress(addresses: string): IConnectionStringHost[] {
		return addresses.split(",")
			.map((address) => {
				const i = address.indexOf(":");

				return (i >= 0 ?
					{ host: decodeURIComponent(address.substring(0, i)), port: +address.substring(i + 1) } :
					{ host: decodeURIComponent(address) }) as IConnectionStringHost;
			});
	}

	/**
	 * Parses options
	 * @param options The options to process
	 */
	private _parseOptions(options: string): { [key: string]: string } {
		const result: { [key: string]: string } = {};

		options.split("&")
			.forEach((option) => {
				const i = option.indexOf("=");

				if (i >= 0) {
					result[decodeURIComponent(option.substring(0, i))] = decodeURIComponent(option.substring(i + 1));
				}
			});
		return result;
	}
}