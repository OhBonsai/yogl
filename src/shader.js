import Constant from "./constant"
import Resource from "./resource"


class ShaderUtil {
    //get the text of a script tag that are storing shader code.
    static domShaderSrc(elmID) {
        let elm = document.getElementById(elmID);
        if (!elm || elm.text === "") {
            console.log(elmID + " shader not found or no text.");
            return null;
        }

        return elm.text;
    }

    //Create a shader by passing in its code and what type
    static createShader(src, type) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        //Get Error data if shader failed compiling
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Error compiling shader : " + src, gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    //Link two compiled shaders to create a program for rendering.
    static createProgram(vShader, fShader, doValidate) {
        //Link shaders together
        let prog = gl.createProgram();
        gl.attachShader(prog, vShader);
        gl.attachShader(prog, fShader);

        //Force predefined locations for specific attributes. If the attibute isn't used in the shader its location will default to -1
        //gl.bindAttribLocation(prog,ATTR_POSITION_LOC,ATTR_POSITION_NAME);
        //gl.bindAttribLocation(prog,ATTR_NORMAL_LOC,ATTR_NORMAL_NAME);
        //gl.bindAttribLocation(prog,ATTR_UV_LOC,ATTR_UV_NAME);

        gl.linkProgram(prog);

        //Check if successful
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error("Error creating shader program.", gl.getProgramInfoLog(prog));
            gl.deleteProgram(prog);
            return null;
        }

        //Only do this for additional debugging.
        if (doValidate) {
            gl.validateProgram(prog);
            if (!gl.getProgramParameter(prog, gl.VALIDATE_STATUS)) {
                console.error("Error validating program", gl.getProgramInfoLog(prog));
                gl.deleteProgram(prog);
                return null;
            }
        }

        //Can delete the shaders since the program has been made.
        gl.detachShader(prog, vShader); //TODO, detaching might cause issues on some browsers, Might only need to delete.
        gl.detachShader(prog, fShader);
        gl.deleteShader(fShader);
        gl.deleteShader(vShader);

        return prog;
    }

    //-------------------------------------------------
    // Helper functions
    //-------------------------------------------------

    //Pass in Script Tag IDs for our two shaders and create a program from it.
    static domShaderProgram(vectID, fragID, doValidate) {
        let vShaderTxt = ShaderUtil.domShaderSrc(vectID);
        if (!vShaderTxt) return null;
        let fShaderTxt = ShaderUtil.domShaderSrc(fragID);
        if (!fShaderTxt) return null;
        let vShader = ShaderUtil.createShader(vShaderTxt, gl.VERTEX_SHADER);
        if (!vShader) return null;
        let fShader = ShaderUtil.createShader(fShaderTxt, gl.FRAGMENT_SHADER);
        if (!fShader) {
            gl.deleteShader(vShader);
            return null;
        }
        return ShaderUtil.createProgram(vShader, fShader, true);
    }

    static createProgramFromText(vShaderTxt, fShaderTxt, doValidate) {
        let vShader = ShaderUtil.createShader(vShaderTxt, gl.VERTEX_SHADER);
        if (!vShader) return null;
        let fShader = ShaderUtil.createShader(fShaderTxt, gl.FRAGMENT_SHADER);
        if (!fShader) {
            gl.deleteShader(vShader);
            return null;
        }
        return ShaderUtil.createProgram(vShader, fShader, true);
    }
}

class ShaderBuilder {
    constructor(vertShader, fragShader) {
        if (gl === null) {
            window.alert("Init gl firstly")
        }

        //If the text is small, then its most likely DOM names (very hack) else its actual Source.
        //TODO, Maybe check for new line instead of length, Dom names will never have new lines but source will.
        if (vertShader.length < 20) this.program = ShaderUtil.domShaderProgram(vertShader, fragShader, true);
        else this.program = ShaderUtil.createProgramFromText(vertShader, fragShader, true);

        if (this.program !== null) {
            gl.useProgram(this.program);
            this._UniformList = [];		//List of Uniforms that have been loaded in. Key=UNIFORM_NAME {loc,type}
            this._TextureList = [];		//List of texture uniforms, Indexed {loc,tex}
        }
    }

    //---------------------------------------------------
    // Methods For Shader Prep.
    //---------------------------------------------------
    //Takes in unlimited arguments. Its grouped by two so for example (UniformName,UniformType): "uColors","3fv"
    prepareUniforms(uName, uType) {
        if (arguments.length % 2 !== 0) {
            console.log("prepareUniforms needs arguments to be in pairs.");
            return this;
        }

        let loc = 0;
        for (let i = 0; i < arguments.length; i += 2) {
            loc = gl.getUniformLocation(this.program, arguments[i]);
            if (loc !== null) this._UniformList[arguments[i]] = {loc: loc, type: arguments[i + 1]};
            else console.log("Uniform not found " + arguments[i]);
        }
        return this;
    }

    prepareUniformBlocks(ubo, blockIndex) {
        let ind = 0;
        for (let i = 0; i < arguments.length; i += 2) {
            //ind = gl.getUniformBlockIndex(this.program,arguments[i].blockName); //TODO This function does not return block index, need to pass that value in param
            console.log("Uniform Block Index", ind, ubo.blockName, ubo.blockPoint);

            gl.uniformBlockBinding(this.program, arguments[i + 1], arguments[i].blockPoint);

            //console.log(gl.getActiveUniformBlockParameter(this.program, 0, gl.UNIFORM_BLOCK_DATA_SIZE)); //Get Size of Uniform Block
            //console.log(gl.getActiveUniformBlockParameter(this.program, 0, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES));
            //console.log(gl.getActiveUniformBlockParameter(this.program, 0, gl.UNIFORM_BLOCK_ACTIVE_UNIFORMS));
            //console.log(gl.getActiveUniformBlockParameter(this.program, 0, gl.UNIFORM_BLOCK_BINDING));
        }
        return this;
    }

    //Takes in unlimited arguments. Its grouped by two so for example (UniformName,CacheTextureName): "uMask01","tex001";
    prepareTextures(uName, TextureCacheName) {
        if (arguments.length % 2 !== 0) {
            console.log("prepareTextures needs arguments to be in pairs.");
            return this;
        }

        let loc = 0, tex = "";
        for (let i = 0; i < arguments.length; i += 2) {
            tex = Resource.Textures[arguments[i + 1]];
            if (tex === undefined) {
                console.log("Texture not found in cache " + arguments[i + 1]);
                continue;
            }

            loc = gl.getUniformLocation(this.program, arguments[i]);
            if (loc !== null) _TextureList.push({loc: loc, tex: tex});
        }
        return this;
    }

    //---------------------------------------------------
    // Setters Getters
    //---------------------------------------------------
    //Uses a 2 item group argument array. Uniform_Name, Uniform_Value;
    setUniforms(uName, uValue) {
        if (arguments.length % 2 !== 0) {
            console.log("setUniforms needs arguments to be in pairs.");
            return this;
        }

        let name;
        for (let i = 0; i < arguments.length; i += 2) {
            name = arguments[i];
            if (this._UniformList[name] === undefined) {
                console.log("uniform not found " + name);
                return this;
            }

            switch (this._UniformList[name].type) {
                case "vec2":
                    gl.uniform2fv(this._UniformList[name].loc, arguments[i + 1]);
                    break;
                case "vec3":
                    gl.uniform3fv(this._UniformList[name].loc, arguments[i + 1]);
                    break;
                case "vec4":
                    gl.uniform4fv(this._UniformList[name].loc, arguments[i + 1]);
                    break;
                case "mat4":
                    gl.uniformMatrix4fv(this._UniformList[name].loc, false, arguments[i + 1]);
                    break;
                default:
                    console.log("unknown uniform type for " + name);
                    break;
            }
        }
        return this;
    }

    //---------------------------------------------------
    // Methods
    //---------------------------------------------------
    activate() {
        gl.useProgram(this.program);
        return this;
    }

    deactivate() {
        gl.useProgram(null);
        return this;
    }

    //function helps clean up resources when shader is no longer needed.
    dispose() {
        //unbind the program if its currently active
        if (gl.getParameter(gl.CURRENT_PROGRAM) === this.program) gl.useProgram(null);
        gl.deleteProgram(this.program);
    }

    preRender() {
        gl.useProgram(this.program); //Save a function call and just activate this shader program on preRender

        //If passing in arguments, then lets push that to setUniforms for handling. Make less line needed in the main program by having preRender handle Uniforms
        if (arguments.length > 0) this.setUniforms.apply(this, arguments);

        //..........................................
        //Prepare textures that might be loaded up.
        //TODO, After done rendering need to deactivate the texture slots
        if (this._TextureList.length > 0) {
            let texSlot;
            for (let i = 0; i < this.mTextureList.length; i++) {
                texSlot = gl["TEXTURE" + i];
                gl.activeTexture(texSlot);
                gl.bindTexture(gl.TEXTURE_2D, this._TextureList[i].tex);
                gl.uniform1i(this._TextureList[i].loc, i);
            }
        }

        return this;
    }
}

class Material {
    static create(name, shaderName, opt) {
        let m = new Material(opt);
        m.shader = Resource.Shaders[shaderName];
        Resource.Materials[name] = m;
        return m;
    }

    constructor(opt) {
        this.shader = null;
        this.uniforms = [];

        this.useCulling = Constant.CULLING_STATE;
        this.useBlending = Constant.BLENDING_STATE;
        this.useModelMatrix = true;
        this.useNormalMatrix = false;
        this.drawMode = gl.TRIANGLES;
    }
}

function NewShader(name, vert, frag) {
    let shader = new ShaderBuilder(vert, frag);
    Resource.Shaders[name] = shader;
    return shader;
}

export default {
    Material,
    ShaderUtil,
    ShaderBuilder,
    NewShader
}