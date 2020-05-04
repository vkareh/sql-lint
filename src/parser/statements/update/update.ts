import { Query } from "../../../reader/query";
import { IParser } from "../../interface";
import * as nearley from "nearley";
import * as grammar from "./grammar";
import { Types } from "../../types";
import { Token } from "../../token";

class Update implements IParser {
  public options: string[] = [];

  public parse(query: Query): Query {
    
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar.default));
    const ast = parser.feed(query.getContent());

    query.lines[0].tokens.push(new Token(Types.Keyword, ast.results[0].keyword.toLowerCase().trim()));
    query.lines[0].tokens.push(new Token(Types.Option, ast.results[0].option.toLowerCase().trim()));

    return query;
  }
}

export { Update };