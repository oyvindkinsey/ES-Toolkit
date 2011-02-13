function Tokenizer(src){
    this.source = src.replace(/\r\n/gm, '\n').replace(/\r/gm, '\n');
    this.length = this.source.length;
    this.pos = 0;
    this.tokens = [];
    this.lastToken = {};
    this.line = 1;
    this.col = 1;
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
        RegularExpressionLiteral: "RegularExpressionLiteral",
        CommentSingleLine: "CommentSingleLine",
        CommentMultiLine: "CommentMultiLine",
        Punctuator: "Punctuator",
        LineTerminator: "LineTerminator",
        Semicolon: "Semicolon",
        Identifier: "Identifier",
        Whitespace: "Whitespace",
        EOF: "EOF"
    },
    /*
     * These are all treated as keywords and ends up as Keyword tokens
     */
    KEYWORDS: (function(){
        // do not add 'this' here
        var punctuators = "break case catch continue default delete do else finally for function if in instanceof new return switch throw try typeof var void while with class".split(" ");
        var map = {};
        for (var i = 0, len = punctuators.length; i < len; i++) {
            map[punctuators[i]] = 1;
        }
        return map;
        
    })(),
    PUNCTUATORS: (function(){
        var punctuators = "{ } ( ) [ ] . ; , < > <= >= == != === !== + - * % ++ -- << >> >>> & | ^ ! ~ && || ? : = += -= *= %= <<= >>=? >>>= &= |= ^= / /=".split(" ");
        var map = {};
        for (var i = 0, len = punctuators.length; i < len; i++) {
            map[punctuators[i]] = 1;
        }
        return map;
    })(),
    log: function(msg){
        //console.log("Tokenizer: " + msg);
    },
    /*
     * Returns the next set of consecutive non-space characters
     */
    peekWord: function(){
        var pos = this.pos;
        while (/[\w$]/.test(this.peek())) {
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
        var chr = "", next;
        while (((next = this.peek()) && (this.PUNCTUATORS.hasOwnProperty((chr += next))))) {
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
        return this.source.charAt(start);
    },
    /*
     * Adds a new token of the given type to the stream, moving the index and validating the tokens content.
     */
    newToken: function(type, data, value){
        var token, pos = this.pos, nextPos = pos, chr, escaped = false;
        this.lastToken = token = {
            type: type,
            data: data,
            value: value,
            pos: [this.line, this.col]
        };
        this.tokens.push(token);
        
        //extract the value and skip ahead to the end 
        switch (type) {
            case this.TYPES.CommentSingleLine:
                nextPos = this.source.indexOf("\n", pos) + 1;
                if (nextPos === 0) {
                    nextPos = this.length + 1;
                }
                token.value = this.source.substring(pos + 2, nextPos - 1);
                this.line++;
                this.col = 1;
                break;
                
            case this.TYPES.CommentMultiLine:
                nextPos = this.source.indexOf("*/", pos) + 2;
                token.value = this.source.substring(pos + 2, nextPos - 3);
                this.line += token.value.split(/\n/).length - 1;
                this.col = 1;
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
                        throw new SyntaxError("Unexspected \\n (" + this.line + "," + this.col + ")");
                    }
                }
                this.pos++;
                nextPos = this.pos;
                token.value = this.source.substring(pos + 1, nextPos - 1);
                this.col += token.value.length + 2;
                break;
                
            case this.TYPES.NumericLiteral:
                if ((data == "0" && this.peek(1) == "x")) {
                    //move past the x
                    this.pos += 2;
                    
                    while (/[\dabcdef]/i.test((chr = this.peek()))) {
                        this.pos++;
                    }
                }
                else {
                    //find the next chr that's not a digit or .
                    while (/[\d.e]/i.test((chr = this.peek())) && this.pos < this.length) {
                        this.pos++;
                    }
                }
                nextPos = this.pos;
                token.value = this.source.substring(pos, nextPos);
                this.col += token.value.length;
                break;
                
            case this.TYPES.RegularExpressionLiteral:
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
                    if (chr == "\n" || chr == "") {
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
                this.col += token.value.length;
                break;
                
            default:
                nextPos += data.length;
                this.col += data.length;
                
        }
        
        // update the index
        this.pos = nextPos;
        this.log("newToken: " + type + ": " + (token.value || data || ""));
        return token;
    },
    read: function(expectsRegExp){
        var chr = this.peek(), nextChr;
        if (chr === "") {
            return {
                type: this.TYPES.EOF
            };
        }
        
        if (chr == "\n") {
            this.line++;
            this.col = 1;
            return this.newToken(this.TYPES.LineTerminator, chr);
        }
        //skip whitespace
        if (/\s/.test(chr)) {
            this.pos++;
            this.col++;
            return {
                type: this.TYPES.Whitespace
            };
        }
        
        
        if (chr == "\\") {
            throw new SyntaxError("Unexpected token ILLEGAL (" + this.line + "," + this.col + ")");
        }
        
        //this might be a comment or a regexp
        if (chr == "/") {
            nextChr = this.peek(1);
            if (nextChr == "/") {
                // single line comment
                return this.newToken(this.TYPES.CommentSingleLine, chr);
            }
            if (nextChr == "*") {
                // multi line comment
                return this.newToken(this.TYPES.CommentMultiLine, chr);
            }
            if (expectsRegExp) {
                return this.newToken(this.TYPES.RegularExpressionLiteral, chr);
            }
        }
        
        if (chr == ";") {
            // add this as a special token instead of as a Punctuator
            return this.newToken(this.TYPES.Semicolon, chr);
        }
        if (this.PUNCTUATORS.hasOwnProperty(chr)) {
            if (chr == ".") {
                //if the next character is a digit then this is a number
                if (/\d/.test(this.peek(1))) {
                    return this.newToken(this.TYPES.NumericLiteral, chr);
                }
            }
            //see if we can find more
            chr = this.peekOperators();
            return this.newToken(this.TYPES.Punctuator, chr);
        }
        
        //this is a string
        if (chr == "\"" || chr == "'") {
            return this.newToken(this.TYPES.StringLiteral, chr);
        }
        
        //this is a number
        if (/\d/.test(chr)) {
            return this.newToken(this.TYPES.NumericLiteral, chr);
        }
        
        //keywords
        var word = this.peekWord();
        if (this.KEYWORDS.hasOwnProperty(word)) {
            return this.newToken(this.TYPES.Keyword, word);
        }
        switch (word) {
            case "null":
                return this.newToken(this.TYPES.NullLiteral, word);
            case "true": // fall through
            case "false":
                return this.newToken(this.TYPES.BooleanLiteral, word);
            default:
                //what's left now are identifiers (variables, function names, types - these will be turned into symbols by the AST generator
                return this.newToken(this.TYPES.Identifier, word);
        }
    }
};

