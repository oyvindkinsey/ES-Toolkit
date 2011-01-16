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
        BooleanLiteral: "BooleanLiteral",
        StringLiteral: "StringLiteral",
        NullLiteral: "NullLiteral",
        NumericLiteral: "NumericLiteral",
        RegExp: "RegExp",
        Paren: "Paren",
        Block: "Block",
        CommentSingleLine: "CommentSingleLine",
        CommentMultiLine: "CommentMultiLine",
        Punctuator: "Punctuator",
        EOL: "EOL",
        Identifier: "Identifier"
    },
    /*
     * These are all treated as keywords and ends up as Keyword tokens
     */
    KEYWORDS: (function(){
        var punctuators = "break case catch continue default delete do else finally for function if in instanceof new return switch this throw try typeof var void while with".split(" ");
        var map = {};
        for (var i = 0, len = punctuators.length; i < len; i++) {
            map[punctuators[i]] = 1;
        }
        return map;
        
    })(),
    PUNCTUATORS: (function(){
        var punctuators = "{ } ( ) [ ] . ; , < > <= >= == != === !== + - * % ++ -- << >> >>> & | ^ ! ~ && || ? : = += -= *= %= <<= >>=? >>>= &= |= ^=".split(" ");
        var map = {};
        for (var i = 0, len = punctuators.length; i < len; i++) {
            map[punctuators[i]] = 1;
        }
        return map;
    })(),
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
        var chr = "";
        while ((chr += this.peek()) in this.PUNCTUATORS) {
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
                
            case this.TYPES.StringLiteral:
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
                token.value = this.source.substring(pos + 1, nextPos - 1);
                break;
                
            case this.TYPES.NumericLiteral:
                if (data == "+" || data == "-") {
                    this.pos++;
                }
                
                if ((data == "0" && this.peek(1) == "x")) {
                    //move past the x
                    this.pos += 2;
                    
                    while (/[\dabcdef]/i.test((chr = this.peek()))) {
                        this.pos++;
                    }
                }
                else {
                    //find the next chr that's not a digit or .
                    while (/[\d.e]/i.test((chr = this.peek()))) {
                        this.pos++;
                    }
                }
                nextPos = this.pos;
                token.value = this.source.substring(pos, nextPos);
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
        this.log("newToken: " + type + ": " + (token.value || data || ""));
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
            
            if (chr == "\n" && this.lastToken) {
                if (this.lastToken && this.lastToken.type == this.TYPES.EOL) {
                    //no need to add multiple EOL tokens
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
                if (this.lastToken.type != this.TYPES.NumericLiteral) {
                    // this must be a regexp
                    this.newToken(this.TYPES.RegExp, chr);
                    continue;
                }
            }
            if (chr == "-" || chr == "+") {
                nextChr = this.peek(1);
                if (/[\d.]/.test(nextChr)) {
                    this.newToken(this.TYPES.NumericLiteral, chr);
                    continue;
                }
            }
            
            if (chr in this.PUNCTUATORS) {
                if (chr == ".") {
                    //if the next character is a digit then this is a number
                    if (/\d/.test(this.peek(1))) {
                        this.newToken(this.TYPES.NumericLiteral, chr);
                        continue;
                    }
                }
                
                //see if we can find more
                chr = this.peekOperators();
                this.newToken(this.TYPES.Punctuator, chr);
                continue;
            }
            
            //this is a string
            if (chr == "\"" || chr == "'") {
                this.newToken(this.TYPES.StringLiteral, chr);
                continue;
            }
            
            //this is a number
            if (/\d/.test(chr)) {
                this.newToken(this.TYPES.NumericLiteral, chr);
                continue;
            }
            
            //keywords
            var word = this.peekWord();
            if (word in this.KEYWORDS) {
                this.newToken(this.TYPES.Keyword, word);
                continue;
            }
            switch (word) {
                case "null":
                    this.newToken(this.TYPES.NullLiteral, word);
                    break;
                case "true": // fall through
                case "false":
                    this.newToken(this.TYPES.BooleanLiteral, word);
                    break;
                default:
                    //what's left now are identifiers (variables, function names, types - these will be turned into symbols by the AST generator
                    this.newToken(this.TYPES.Identifier, word);
            }
        }
        
        return this.tokens;
    }
};

