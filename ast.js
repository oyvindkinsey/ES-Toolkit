//todo: [this.symbol], > MemberExpression

function AstGenerator(stream){
    this.stream = stream;
    this.pos = 0;
    this.length = stream.length;
    this.symbol = {
        type: this.TYPES.SourceElement
    };
    this.global = {
        type: this.TYPES.Program,
        stream: [this.symbol],
        vo: {}
    };
    this.stack = [this.global, this.symbol];
    this.head = this.symbol;
    this.lastToken = {
        type: this.TYPES.LineTerminator
    };
}

AstGenerator.prototype = {
    push: function(symbol){
        this.stack.push(symbol);
        this.head = symbol;
        return symbol;
    },
    pop: function(){
        var symbol = this.stack.pop();
        this.head = this.stack[this.stack.length - 1];
        return this.head;
    },
    add: function(symbol){
        if (!("stream" in this.head)) {
            this.head.stream = [];
        }
        this.head.stream.push(symbol);
        return symbol;
    },
    take: function(){
        return this.head.stream.pop();
    },
    TYPES: {
        Program: "Program",
        FunctionExpression: "FunctionExpression",
        FunctionDeclaration: "FunctionDeclaration",
        Keyword: "Keyword",
        SourceElement: "SourceElement",
        CallExpression: "CallExpression",
        GroupingExpression: "GroupingExpression",
        MemberExpression: "MemberExpression",
        AssignmentExpression: "AssignmentExpression",
        Statement: "Statement",
        FormalParameterList: "FormalParameterList",
        SwitchStatement: "SwitchStatement",
        SwitchExpression: "SwitchExpression",
        SwitchBlock: "SwitchBlock",
        CaseStatement: "CaseStatement",
        CaseClause: "CaseClause",
        Arguments: "Arguments",
        StatementList: "StatementList",
        Punctuator: "Punctuator",
        Parameter: "Parameter",
        Initializer: "Initializer",
        Identifier: "Identifier",
        PropertyAssignment: "PropertyAssignment",
        VariableStatement: "VariableStatement",
        VariableDeclaration: "VariableDeclaration",
        Block: "Block",
        BooleanLiteral: "BooleanLiteral",
        ArrayLiteral: "ArrayLiteral",
        ObjectLiteral: "ObjectLiteral",
        StringLiteral: "StringLiteral",	
        NumericLiteral: "NumericLiteral",
        RegularExpressionLiteral: "RegularExpressionLiteral"
    },
    log: function(msg){
        console.log("AST: " + msg);
    },
    readNext: function(){
        return this.stream[this.pos++];
    },
    read: function(){
        var TYPES = Tokenizer.prototype.TYPES;
        var token, previousToken = {
            type: TYPES.Semicolon
        }, head, symbol;
        
        while (this.pos < this.length) {
            token = this.readNext();
            head = this.head;
            
            // todo: implement ASI
            if (token.type == TYPES.LineTerminator) {
                //ignore the LineTerminator unless we need to do ASI
                var skip = true;
                if (this.lastToken.type != TYPES.Semicolon) {
                    //set skip to false if token was replaced by Semicolon
                }
                if (skip) {
                    continue;
                }
            }
            
            switch (token.type) {
            
                case TYPES.Semicolon:
                    // pop until we hit the SourceElement
                    while (this.head.type != this.TYPES.SourceElement && this.head.type != this.TYPES.StatementList) {
                        this.pop();
                    }
                    break;
                case TYPES.Keyword:
                    
                    switch (token.data) {
                        case "function":
                            symbol = this.push(this.add({
                                type: (previousToken.type == TYPES.Semicolon) ? this.TYPES.FunctionDeclaration : this.TYPES.FunctionExpression
                            }));
                            // move through the identifier and the formal parameter list
                            token = this.readNext();
                            if (token.type == TYPES.Identifier) {
                                symbol.name = token.data;
                                token = this.readNext();
                            }
                            this.push(this.add({
                                type: this.TYPES.FormalParameterList
                            }));
                            
                            while (token.data != ")") {
                                if (token.type == TYPES.Identifier) {
                                    this.add({
                                        type: this.TYPES.Identifier,
                                        name: token.data
                                    });
                                }
                                token = this.readNext();
                            }
                            this.pop(); // FormalParameterList
                            break;
                            
                        case "var":
                            symbol = this.push(this.add({
                                type: this.TYPES.VariableStatement
                            }));
                            break;
                            
                        case "switch":
                            symbol = this.push(this.add({
                                type: this.TYPES.SwitchStatement
                            }));
                            break;
                            
                        case "case":
                            while (this.head.type != this.TYPES.SwitchBlock) {
                                this.pop();
                            }
                            symbol = this.push(this.add({
                                type: this.TYPES.CaseStatement
                            }));
                            
                            symbol = this.push(this.add({
                                type: this.TYPES.CaseClause
                            }));
                            
                            break;
                            
                        case "default":
                            while (this.head.type != this.TYPES.SwitchBlock) {
                                this.pop();
                            }
                            symbol = this.push(this.add({
                                type: this.TYPES.CaseStatement
                            }));
                            
                            symbol = this.push(this.add({
                                type: this.TYPES.StatementList
                            }));
                            
                            break;
							
						case "this":
                            symbol = this.add({
                                type: this.TYPES.Keyword,
                                name: token.data
                            });						
							break;
							
                        default:
                            symbol = this.add({
                                type: this.TYPES.Keyword,
                                name: token.data
                            });
                    }
                    break;
                    
                case TYPES.Identifier:
                    switch (head.type) {
                        case this.TYPES.VariableStatement:
                            symbol = this.push(this.add({
                                type: this.TYPES.VariableDeclaration,
                                name: token.data
                            }));
                            break;
                            
                        case this.TYPES.ObjectLiteral:
                            symbol = this.push(this.add({
                                type: this.TYPES.PropertyAssignment,
                                name: token.data
                            }));
                            break
                        default:
                            if (previousToken.type == TYPES.Semicolon) {
                                symbol = this.push(this.add({
                                    type: this.TYPES.Statement
                                }));
                            }
                            symbol = this.add({
                                type: this.TYPES.Identifier,
                                name: token.data
                            });
                    }
                    if (head.type == this.TYPES.MemberExpression) {
                        this.pop(); //MemberExpression
                    }
                    break;
                    
                case TYPES.StringLiteral:
                    if (head.type == this.TYPES.ObjectLiteral) {
                        symbol = this.push(this.add({
                            type: this.TYPES.PropertyAssignment,
                            name: token.value
                        }));
                    }
                    else {
                        this.add({
                            type: this.TYPES.StringLiteral,
                            value: token.value
                        });
                    }
                    break;
                    
                case TYPES.NumericLiteral:
                    this.add({
                        type: this.TYPES.NumericLiteral,
                        value: token.value
                    });
                    
                    break;
                    
                case TYPES.BooleanLiteral:
                    this.add({
                        type: this.TYPES.BooleanLiteral,
                        value: token.data
                    });
                    break;
                    
                case TYPES.RegularExpressionLiteral:
                    this.add({
                        type: this.TYPES.RegularExpressionLiteral,
                        value: token.value
                    });
                    break;
                    
                case TYPES.Punctuator:
                    
                    switch (token.data) {
                        case "=":
                            if (head.type == this.TYPES.VariableDeclaration) {
                                this.push(symbol);
                                this.push(this.add({
                                    type: this.TYPES.Initializer
                                }));
                            }
                            else {
                                // replace symbol with AssignmentExpression
                                symbol = this.push(this.add({
                                    type: this.TYPES.AssignmentExpression,
                                    stream: [this.take()]
                                }));
                            }
                            break;
                            
                        case ".":
                            symbol = this.push(this.add({
                                type: this.TYPES.MemberExpression
                            }));
                            break;
                            
                        case ":":
                            if (head.type == this.TYPES.CaseClause) {
                                this.pop();
                                symbol = this.push(this.add({
                                    type: this.TYPES.StatementList
                                }));
                            }
                            break;
                            
                        case ",":
                            var popTo = {};
                            popTo[this.TYPES.VariableStatement] = 1;
                            popTo[this.TYPES.CallExpression] = 1;
                            popTo[this.TYPES.GroupingExpression] = 1;
                            popTo[this.TYPES.ArrayLiteral] = 1;
                            popTo[this.TYPES.Statement] = 1;
							popTo[this.TYPES.ObjectLiteral] = 1;
							
                            while (!(this.head.type in popTo)) {
                                this.pop();
                            }
                            
                            break;
                            
                        case "(":
                            if (previousToken.type == TYPES.Identifier || previousToken.data == "]" || previousToken.data == ")") {
                                symbol = this.push(this.add({
                                    type: this.TYPES.CallExpression
                                }));
                            }
                            else {
                                if (head.type == this.TYPES.SwitchStatement) {
                                    symbol = this.push(this.add({
                                        type: this.TYPES.SwitchExpression
                                    }));
                                    
                                }
                                else {
                                    symbol = this.push(this.add({
                                        type: this.TYPES.GroupingExpression
                                    }));
                                }
                            }
                            break;
                            
                        case ")":
                            
                            this.pop();
                            if (this.head.type == this.TYPES.GroupingExpression) {
                                this.pop();
                            }
                            break;
                            
                        case "[":
                            if (previousToken.type == TYPES.Identifier || previousToken.data == "]" || previousToken.data == ")") {
                                symbol = this.push(this.add({
                                    type: this.TYPES.MemberExpression
                                }));
                            }
                            else {
                                symbol = this.push(this.add({
                                    type: this.TYPES.ArrayLiteral
                                }));
                            }
                            break;
                            
                        case "]":
                            this.pop();
                            break;
                            
                        case "{":
                            if (head.type == this.TYPES.FunctionDeclaration || head.type == this.TYPES.FunctionExpression) {
                                symbol = this.push(this.add({
                                    type: this.TYPES.SourceElement
                                }));
                            }
                            else {
                                if (head.type == this.TYPES.SwitchStatement) {
                                    symbol = this.push(this.add({
                                        type: this.TYPES.SwitchBlock
                                    }));
                                    break;
                                }
                                switch (previousToken.type) {
                                    case this.TYPES.Semicolon: //fall through
                                    case this.TYPES.Keyword:
                                        symbol = this.push(this.add({
                                            type: this.TYPES.Block
                                        }));
                                        break;
                                        
                                    default:
                                        symbol = this.push(this.add({
                                            type: this.TYPES.ObjectLiteral
                                        }));
                                }
                            }
                            break;
                            
                        case "}":
                            
                            this.pop(); // close the pair
                            if (head.type == this.TYPES.SourceElement) {
                                this.pop(); // FunctionExpression/FunctionDeclaration
                            }
                            if (head.type == this.TYPES.PropertyAssignment) {
                                this.pop(); //PropertyAssignment
                            }
                            if (head.type == this.TYPES.StatementList) {
                                while (this.head.type != this.TYPES.SourceElement) {
                                    this.pop();
                                }
                            }
                            break;
                            
                        default:
                            symbol = this.add({
                                type: this.TYPES.Punctuator,
                                value: token.data
                            });
                    }
                    break;
            }
            
            previousToken = token;
        }
        
        console.log(this.head);
        if (this.stack.length > 2) {
            console.log(this.stack[this.stack.length - 1])
            console.log("Non-terminated " + this.stack[this.stack.length - 1].type);
        }
        return this.symbol;
    }
};
