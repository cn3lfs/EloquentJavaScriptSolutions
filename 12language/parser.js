function parseExpression(program) {
  program = skipSpace(program);
  let match, expr;
  if ((match = /^"([^"]*)"/.exec(program))) {
    expr = { type: "value", value: match[1] };
  } else if ((match = /^\d+\b/.exec(program))) {
    expr = { type: "value", value: Number(match[0]) };
  } else if ((match = /^[^\s(),#"]+/.exec(program))) {
    expr = { type: "word", name: match[0] };
  } else {
    throw new SyntaxError("Unexpected syntax: " + program);
  }

  return parseApply(expr, program.slice(match[0].length));
}

// function skipSpace(string) {
//   let first = string.search(/\S/);
//   if (first == -1) return "";
//   return string.slice(first);
// }

function skipSpace(string) {
  let skippable = string.match(/^(\s|#.*)*/);
  // 把匹配上的备注信息或空白全部跳过
  return string.slice(skippable[0].length);
}

function parseApply(expr, program) {
  program = skipSpace(program);
  if (program[0] != "(") {
    return { expr: expr, rest: program };
  }

  program = skipSpace(program.slice(1));
  expr = { type: "apply", operator: expr, args: [] };
  while (program[0] != ")") {
    let arg = parseExpression(program);
    expr.args.push(arg.expr);
    program = skipSpace(arg.rest);
    if (program[0] == ",") {
      program = skipSpace(program.slice(1));
    } else if (program[0] != ")") {
      throw new SyntaxError("Expected ',' or ')'");
    }
  }
  return parseApply(expr, program.slice(1));
}

export function parse(program) {
  let { expr, rest } = parseExpression(program);
  if (skipSpace(rest).length > 0) {
    throw new SyntaxError("Unexpected text after program");
  }
  return expr;
}

function testParse() {
  console.log(parse("+(a, 10)"));
  // → {type: "apply",
  //    operator: {type: "word", name: "+"},
  //    args: [{type: "word", name: "a"},
  //           {type: "value", value: 10}]}
}

// testParse();

function testComments() {
  console.log(parse("# hello\nx"));
  // → {type: "word", name: "x"}

  console.log(parse("a # one\n   # two\n()"));
  // → {type: "apply",
  //    operator: {type: "word", name: "a"},
  //    args: []}
}

// testComments();
