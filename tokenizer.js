function Tokenizer(src){
    this.source = src.replace(/\r\n/gm, '\n').replace(/\r/gm, '\n');
    this.length = this.source.length;
    this.pos = 0;
    this.tokens = [];
}

Tokenizer.prototype = {
    /*
     * These are the types of tokens we curently produce
     */
    TYPES: {
        Keyword: "Keyword",
        String: "String",
        Number: "Number",
        RegExp: "RegExp",
        Paren: "Paren",
        Block: "Block",
        CommentSingleLine: "CommentSingleLine",
        CommentMultiLine: "CommentMultiLine",
        Operator: "Operator",
        EOL: "EOL",
        Semicolon: "Semicolon",
        Identifier: "Identifier"
    },
    /*
     * These are all treated as operators and ends up as Operator tokens
     */
    OPERATORS: {
        '.': 1,
        ',': 1,
        '+': 1,
        '-': 1,
        '/': 1,
        '*': 1,
        '+': 1,
        '&': 1,
        '&': 1,
        '|': 1,
        '=': 1,
        '!': 1,
        '<': 1,
        '>': 1,
        '~': 1,
        '^': 1,
        '?': 1,
        ':': 1
    },
    /*
     * These are all treated as keywords and ends up as Keyword tokens
     */
    KEYWORDS: {
        "function": 1,
        "var": 1,
        "delete": 1,
        "while": 1,
        "do": 1,
        "loop": 1,
        "if": 1,
        "else": 1,
        "switch": 1,
        "case": 1,
        "try": 1,
        "catch": 1,
        "in": 1,
        "with": 1
    },
    log: function(msg){
        console.log(msg);
    },
    /*
     * Returns the next set of consecutive non-space characters
     */
    peekWord: function(){
        var pos = this.pos;
        while (/\w/.test(this.peek())) {
            this.pos++;
        }
        var nextPos = this.pos;
        this.pos = pos;
        return this.source.substring(this.pos, nextPos);
    },
    /*
     * Returns the next set of consecutive operators
     */
    peekOperators: function(){
        var pos = this.pos;
        while (this.peek() in this.OPERATORS) {
            this.pos++;
        }
        var nextPos = this.pos;
        this.pos = pos;
        return this.source.substring(this.pos, nextPos);
    },
    /*
     * Returns the next character
     */
    peek: function(start){
        start = this.pos + (start || 0);
        return this.source.slice(start, start + 1);
    },
    /*
     * Adds a new token of the given type to the stream, moving the index and validating the tokens content.
     */
    newToken: function(type, data, value){
        var token, pos = this.pos, nextPos = pos, chr, escaped = false;
        this.lastToken = token = {
            type: type,
            data: data,
            value: value
        };
        this.tokens.push(token);
        
        //extract the value and skip ahead to the end 
        switch (type) {
            case this.TYPES.CommentSingleLine:
                nextPos = this.source.indexOf("\n", pos) + 1;
                token.value = this.source.substring(pos + 2, nextPos - 1);
                break;
                
            case this.TYPES.CommentMultiLine:
                nextPos = this.source.indexOf("*/", pos) + 2;
                token.value = this.source.substring(pos + 2, nextPos - 3);
                break;
                
            case this.TYPES.String:
                while (true) {
                    this.pos++;
                    chr = this.peek();
                    if (chr == data && !escaped) {
                        //we have found it
                        break;
                    }
                    if (chr == "\\") {
                        //for each consequtive \ we flip it
                        escaped = !escaped;
                    }
                    else {
                        escaped = false;
                    }
                    if (chr == "\n") {
                        throw new SyntaxError("Unexspected \\n");
                    }
                }
                this.pos++;
                nextPos = this.pos;
                token.value = this.source.substring(pos, nextPos);
                break;
                
            case this.TYPES.Number:
                var isHex = (data == "0" && this.peek(1) == "x");
                if (isHex) {
                    //move past the x
                    this.pos += 2;
                }
                
                //find the next chr that's not a digit or .
                while (/\d|\./g.test((chr = this.peek()))) {
                    if (isHex && chr == ".") {
                        throw new SyntaxError("Unexpected number");
                    }
                    this.pos++;
                }
                nextPos = this.pos;
                token.value = this.source.substring(pos, nextPos);
                break;
                
            case this.TYPES.Whitespace:
                //find the next chr that is not whitespace
                while (/\s/g.test(this.peek())) {
                    this.pos++;
                }
                break;
                
            case this.TYPES.RegExp:
                //find the next / disregarding those escaped
                while (true) {
                    this.pos++;
                    chr = this.peek();
                    if (chr == "/" && !escaped) {
                        //we have found it
                        break;
                    }
                    if (chr == "\\") {
                        //for each consequtive \ we flip it
                        escaped = !escaped;
                    }
                    else {
                        escaped = false;
                    }
                    if (chr == "\n") {
                        throw new SyntaxError("Invalid regular expression: missing /");
                    }
                }
                this.pos++;
                nextPos = this.pos;
                //skip past any modifiers
                chr = this.peekWord();
                if (chr) {
                    nextPos += chr.length;
                }
                token.value = this.source.substring(pos, nextPos);
                break;
                
            default:
                nextPos += data.length;
                
        }
        
        // update the index
        this.pos = nextPos;
        this.log("newToken: " + type + (data ? ", " + data : "") + (token.value ? " - " + token.value : ""));
    },
    /*
     * This contains the main loop, reading a single character at a time. How many positions each iteration moves ahead
     * is up to the token parser
     */
    parse: function(){
        var chr, nextChr;
        
        // to avoid uncrontrolled loops while debuggin
        var max = 1000, i = 0;
        while ((chr = this.peek())) {
            if (++i == max) {
                throw new Error("Uncontrolled loop");
            }
            
            //EOL will be used by ASI
            if (chr == "\n" && this.lastToken) {
                if (this.lastToken && (this.lastToken.type == this.TYPES.Semicolon || this.lastToken.type == this.TYPES.EOL)) {
                    //no need to add the EOL token when we have a semicolon
                    this.pos++;
                }
                else {
                    this.newToken(this.TYPES.EOL, chr);
                }
                continue;
            }
            
            //skip whitespace
            if (/\s/.test(chr)) {
                this.pos++;
                continue;
            }
            
            
            if (chr == "\\") {
                throw new SyntaxError("Unexpected token ILLEGAL");
            }
            
            if (chr == ";") {
                this.newToken(this.TYPES.Semicolon, chr);
                continue;
            }
            
            //this might be a comment or a regexp
            if (chr == "/") {
                nextChr = this.peek(1);
                if (nextChr == "/") {
                    // single line comment
                    this.newToken(this.TYPES.CommentSingleLine, chr);
                    continue;
                }
                if (nextChr == "*") {
                    // multi line comment
                    this.newToken(this.TYPES.CommentMultiLine, chr);
                    continue;
                }
                if (this.lastToken.type != this.TYPES.Number) {
                    // this must be a regexp
                    this.newToken(this.TYPES.RegExp, chr);
                    continue;
                }
            }
            
            if (chr in this.OPERATORS) {
                //if the next character is a digit then this is a number
                if (chr == ".") {
                    if (/\d/.test(this.peek(1))) {
                        this.newToken(this.TYPES.Number, chr);
                        continue;
                    }
                }
                
                //see if we can find more
                chr = this.peekOperators();
                this.newToken(this.TYPES.Operator, chr);
                continue;
            }
            
            //this is a string
            if (chr == "\"" || chr == "'") {
                this.newToken(this.TYPES.String, chr);
                continue;
            }
            
            //this is a number
            if (/\d/.test(chr)) {
                this.newToken(this.TYPES.Number, chr);
                continue;
            }
            
            //parens
            if (chr == "(" || chr == ")") {
                this.newToken(this.TYPES.Paren, chr);
                continue;
            }
            
            //block
            if (chr == "{" || chr == "}") {
                this.newToken(this.TYPES.Block, chr);
                continue;
            }
            
            var word = this.peekWord();
            if (word in this.KEYWORDS) {
                this.newToken(this.TYPES.Keyword, word);
                continue;
            }
            //what's left now are identifiers (var's, function names, types
            this.newToken(this.TYPES.Identifier, word);
        }
        
        return this.tokens;
    }
};

