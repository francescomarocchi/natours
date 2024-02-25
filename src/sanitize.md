## SANITIZE CODE

- NoSQL query injection ({ "$gt": "" } used as a user logs you in as admin!)
- xss scripting (attacker might save html code inside e.g. user name and app can print it to output)
- parameter pollution (user can destroy application e.g. by repeating same parameter multiple times)
