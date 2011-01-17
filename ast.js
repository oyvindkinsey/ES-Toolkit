function AstGenerator(stream){
    this.stream = stream;
    this.pos = 0;
    this.length = stream.length;
    this.symbol = this.global = {
        type: this.TYPES.Program,
        stream: [],
        vo: {}
    };
    this.stack = [this.global];
    this.head = this.global;
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
    TYPES: {
        Program: "Program",
        FunctionExpression: "FunctionExpression",
        FunctionDeclaration: "FunctionDeclaration",
        SourceElement: "SourceElement",
        CallExpression: "CallExpression",
        GroupingExpression: "GroupingExpression",
        MemberExpression: "MemberExpression",
        Statement: "Statement",
        FormalParameterList: "FormalParameterList",
        Arguments: "Arguments",
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
            type: TYPES.LineTerminator
        }, head, symbol;
        
        while (this.pos < this.length) {
            token = this.readNext();
            head = this.head;
            
            // todo: implement ASI
            
            switch (token.type) {
                case TYPES.Keyword:
                    
                    switch (token.data) {
                        case "function":
                            symbol = this.push(this.add({
                                type: (previousToken.type == TYPES.LineTerminator) ? this.TYPES.FunctionDeclaration : this.TYPES.FunctionExpression
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
                            symbol = this.add({
                                type: this.TYPES.VariableStatement,
                                stream: []
                            });
                            this.push(symbol);
                            break;
                    }
                    break;
                    
                case TYPES.LineTerminator:
                    if (head.type == this.TYPES.VariableStatement || head.type == this.TYPES.Statement) {
                        this.pop();
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
                            if (previousToken.type == TYPES.LineTerminator) {
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
                        if (head.type == this.TYPES.Initializer) {
                            this.pop(); //Initializer
                            this.pop(); //VariableDeclaration
                        }
                        
                        if (head.type == this.TYPES.PropertyAssignment) {
                            this.pop(); //PropertyAssignment
                        }
                    }
                    break;
                    
                case TYPES.NumericLiteral:
                    this.add({
                        type: this.TYPES.NumericLiteral,
                        value: token.value
                    });
                    if (head.type == this.TYPES.Initializer) {
                        this.pop(); //Initializer
                        this.pop(); //VariableDeclaration
                    }
                    if (head.type == this.TYPES.PropertyAssignment) {
                        this.pop(); //PropertyAssignment
                    }
                    break;
                    
                case TYPES.BooleanLiteral:
                    this.add({
                        type: this.TYPES.BooleanLiteral,
                        value: token.data
                    });
                    if (head.type == this.TYPES.Initializer) {
                        this.pop(); //Initializer
                        this.pop(); //VariableDeclaration
                    }
                    if (head.type == this.TYPES.PropertyAssignment) {
                        this.pop(); //PropertyAssignment
                    }
                    break;
                    
                case TYPES.RegularExpressionLiteral:
                    this.add({
                        type: this.TYPES.RegularExpressionLiteral,
                        value: token.value
                    });
                    if (head.type == this.TYPES.Initializer) {
                        this.pop(); //Initializer
                        this.pop(); //VariableDeclaration
                    }
                    if (head.type == this.TYPES.PropertyAssignment) {
                        this.pop(); //PropertyAssignment
                    }
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
                                symbol = this.add({
                                    type: this.TYPES.Punctuator,
                                    value: token.data
                                });
                            }
                            break;
                            
                        case ".":
                            symbol = this.push(this.add({
                                type: this.TYPES.MemberExpression
                            }));
                            break;
                        case ";":
                            if (head.type == this.TYPES.VariableDeclaration) {
                                this.pop(); //VariableDeclaration
                                this.pop(); //VariableStatement
                            }
                            if (head.type == this.TYPES.Initializer) {
                                this.pop(); //Initializer
                                this.pop(); //VariableDeclaration
                                this.pop(); //VariableStatement
                            }
                            
                            break;
                        case ":":
                            break;
                        case ",":
                            if (head.type == this.TYPES.VariableDeclaration) {
                                this.pop(); //VariableDeclaration
                            }
                            if (head.type == this.TYPES.Initializer) {
                                this.pop(); //Initializer
                                this.pop(); //VariableDeclaration
                                this.pop(); //VariableStatement
                            }
                            if (head.type == this.TYPES.PropertyAssignment) {
                                this.pop(); //PropertyAssignment
                            }
                            break;
                            
                        case "(":
                            if (previousToken.type == TYPES.Identifier || previousToken.data == "]" || previousToken.data == ")")) {
                                symbol = this.push(this.add({
                                    type: this.TYPES.CallExpression
                                }));
                            }
                            else {
                                symbol = this.push(this.add({
                                    type: this.TYPES.GroupingExpression
                                }));
                                
                            }
                            break;
                            
                        case ")":
                            this.pop();
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
                                if (previousToken.type == TYPES.LineTerminator) {
                                    symbol = this.push(this.add({
                                        type: this.TYPES.Block
                                    }));
                                }
                                else {
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
        
        if (this.stack.length > 1) {
            throw new Error("Non-terminated " + this.stack[this.stack.length - 1].type);
        }
        console.log(this.symbol);
        return this.symbol;
    }
};
