import Constant from "./constant"
import Resource from "./resource"
import Util from "./util"

var gl = null;
window.gl = gl;


export default function Init(canvasID){
    if(gl !== null) return gl;

    var canvas = document.getElementById(canvasID);
    gl = canvas.getContext("webgl2");
    if(!gl){ window.alert("WebGL context is not available."); return null; }

    //...................................................
    //Setup GL, Set all the default configurations we need.
    gl.cullFace(gl.BACK);								//Back is also default
    gl.frontFace(gl.CCW);								//Dont really need to set it, its ccw by default.
    gl.enable(gl.DEPTH_TEST);							//Shouldn't use this, use something else to add depth detection
    gl.enable(gl.CULL_FACE);							//Cull back face, so only show triangles that are created clockwise
    gl.depthFunc(gl.LEQUAL);							//Near things obscure far things
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);	//Setup default alpha blending
    //gl.clearColor(1.0,1.0,1.0,1.0);	//Set clear color

    //...................................................
    //Methods
    //Reset the canvas with our set background color.
    gl.fClear = function(){ this.clear(this.COLOR_BUFFER_BIT | this.DEPTH_BUFFER_BIT); return this; };
    gl.fClearColor = function(hex){
        var a = Util.rgbArray(hex);
        gl.clearColor(a[0],a[1],a[2],1.0);
        return this;
    }

    //Create and fill our Array buffer.
    gl.fCreateArrayBuffer = function(floatAry,isStatic,isUnbind){
        if(isStatic === undefined) isStatic = true; //So we can call this function without setting isStatic

        var buf = this.createBuffer();
        this.bindBuffer(this.ARRAY_BUFFER,buf);
        this.bufferData(this.ARRAY_BUFFER, floatAry, (isStatic)? this.STATIC_DRAW : this.DYNAMIC_DRAW );
        if(isUnbind != false) this.bindBuffer(this.ARRAY_BUFFER,null);
        return buf;
    };

    //Textures
    gl.fLoadTexture = function(name,img,doYFlip,noMips){
        var tex = Resource.Textures[name] = this.createTexture();
        return this.fUpdateTexture(name,img,doYFlip,noMips);
    };

    gl.fUpdateTexture = function(name,img,doYFlip,noMips){
        var tex = this.mTextureCache[name];
        if(doYFlip == true) this.pixelStorei(this.UNPACK_FLIP_Y_WEBGL, true);	//Flip the texture by the Y Position, So 0,0 is bottom left corner.

        this.bindTexture(this.TEXTURE_2D, tex);														//Set text buffer for work
        this.texImage2D(this.TEXTURE_2D, 0, this.RGBA, this.RGBA, this.UNSIGNED_BYTE, img);			//Push image to GPU.

        if(noMips === undefined || noMips == false){
            this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, this.LINEAR);					//Setup up scaling
            this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, this.LINEAR_MIPMAP_NEAREST);	//Setup down scaling
            this.generateMipmap(this.TEXTURE_2D);	//Precalc different sizes of texture for better quality rendering.
        }else{
            this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, this.NEAREST);
            this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, this.NEAREST);
            this.texParameteri(this.TEXTURE_2D, this.TEXTURE_WRAP_S, this.CLAMP_TO_EDGE);
            this.texParameteri(this.TEXTURE_2D, this.TEXTURE_WRAP_T, this.CLAMP_TO_EDGE);
        }

        this.bindTexture(this.TEXTURE_2D,null);									//Unbind

        if(doYFlip == true) this.pixelStorei(this.UNPACK_FLIP_Y_WEBGL, false);	//Stop flipping textures
        return tex;
    }

    //imgAry must be 6 elements long and images placed in the right order
    //RIGHT,LEFT,TOP,BOTTOM,BACK,FRONT
    gl.fLoadCubeMap = function(name,imgAry){
        if(imgAry.length != 6) return null;

        //Cube Constants values increment, so easy to start with right and just add 1 in a loop
        //To make the code easier costs by making the imgAry coming into the function to have
        //the images sorted in the same way the constants are set.
        //	TEXTURE_CUBE_MAP_POSITIVE_X - Right	:: TEXTURE_CUBE_MAP_NEGATIVE_X - Left
        //	TEXTURE_CUBE_MAP_POSITIVE_Y - Top 	:: TEXTURE_CUBE_MAP_NEGATIVE_Y - Bottom
        //	TEXTURE_CUBE_MAP_POSITIVE_Z - Back	:: TEXTURE_CUBE_MAP_NEGATIVE_Z - Front

        var tex = this.createTexture();
        this.bindTexture(this.TEXTURE_CUBE_MAP,tex);

        //push image to specific spot in the cube map.
        for(var i=0; i < 6; i++){
            this.texImage2D(this.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.RGBA, this.RGBA, this.UNSIGNED_BYTE, imgAry[i]);
        }

        this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_MAG_FILTER, this.LINEAR);	//Setup up scaling
        this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_MIN_FILTER, this.LINEAR);	//Setup down scaling
        this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_WRAP_S, this.CLAMP_TO_EDGE);	//Stretch image to X position
        this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_WRAP_T, this.CLAMP_TO_EDGE);	//Stretch image to Y position
        this.texParameteri(this.TEXTURE_CUBE_MAP, this.TEXTURE_WRAP_R, this.CLAMP_TO_EDGE);	//Stretch image to Z position
        //this.generateMipmap(this.TEXTURE_CUBE_MAP);

        this.bindTexture(this.TEXTURE_CUBE_MAP,null);
        Resource.Textures[name] = tex;
        return tex;
    };

    //...................................................
    //Setters - Getters

    //Set the size of the canvas html element and the rendering view port
    gl.fSetSize = function(w,h){
        //set the size of the canvas, on chrome we need to set it 3 ways to make it work perfectly.
        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";
        this.canvas.width = w;
        this.canvas.height = h;

        //when updating the canvas size, must reset the viewport of the canvas
        //else the resolution webgl renders at will not change
        this.viewport(0,0,w,h);
        this.fWidth = w;	//Need to save Width and Height to resize viewport for WebVR
        this.fHeight = h;
        return this;
    };

    //Set the size of the canvas to fill a % of the total screen.
    gl.fFitScreen = function(wp,hp){ return this.fSetSize(window.innerWidth * (wp || 1),window.innerHeight * (hp || 1)); }

    return gl;
}
