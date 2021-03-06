import * as fs from "fs";
import * as path from "path";
import { CheckFactory } from "./checkFactory";
import { Query } from "../reader/query";
import { Database } from "../database";
import { Printer } from "../printer";
import { categorise, tokenise } from "../lexer/lexer";
import { MySqlError } from "../barrel/checks";

/**
 * Runs all the checks.
 */
class CheckerRunner {
  public run(
    sqlQueries: Query[],
    printer: Printer,
    prefix: string,
    omittedErrors: string[],
    database?: Database
  ) {
    const checks = fs
      .readdirSync(__dirname + "/checks")
      .map(check => {
        return path.parse(check).name;
      })
      .filter(item => {
        const ignoredChecks = [
          "invalidOption",
          "tableNotFound",
          "databaseNotFound"
        ];

        // We ignore the 3 above checks.
        // invalidOption - This is a base class and does actually have any checks
        // tableNotFound - This is built into most SQL servers so is redundant
        // databaseNotFound - This is built into most SQL servers so is redundant
        // .js - There seems to be a discrepancy with filenames when using the compiled
        //       version of sql-lint (./dist/src/main.js). They are finding checks and
        //       including the .js. We ignore those too
        return !ignoredChecks.includes(item) && !item.endsWith(".js");
      });

    const factory = new CheckFactory();

    sqlQueries.forEach((query: any) => {
      const content = query.getContent().trim();

      if (content) {
        const category = categorise(content);
        const tokenised: Query = tokenise(query);
        checks.forEach(check => {
          const checker = factory.build(check);

          // Simple checks
          if (
            checker.appliesTo.includes(category) &&
            !checker.requiresConnection
          ) {
            printer.printCheck(checker, tokenised, prefix);
          }

          // DB server checks
          if (
            checker.requiresConnection &&
            database &&
            checker.appliesTo.includes(category)
          ) {
            database.lintQuery(database.connection, content, (results: any) => {
              const sqlChecker = new MySqlError(results);
              printer.printCheck(sqlChecker, tokenised, prefix);
            });
          }
        });
      }
    });
  }
}

export { CheckerRunner };
