import Constant from "./constant";

class RenderLoop{
    constructor(callback,fps){
        this.isActive		= false;	//Control the On/Off state of the render loop
        this.fps			= 0;		//Save the value of how fast the loop is going.

        this._lastFrame	= null;			//The time in Miliseconds of the last frame.
        this._callBack		= callback;	//What function to call for each frame
        this._frameCaller	= window;	//Normally we'll call window's requestAnimationFrame, but for VR we need to use its HMD reference for that call.
        this._fpsLimit		= 0;		//Limit how many frames per second the loop should do.
        this._runPtr 		= null;		//Pointer to a run function that has this class's scope attached

        this.setFPSLimit( (fps != undefined && fps > 0)?fps:0  );
    }

    stop(){ this.isActive = false; }
    start(){
        this.isActive = true;
        this._LastFrame = performance.now();
        this._frameCaller.requestAnimationFrame(this._runPtr);
        return this;
    }

    setFrameCaller(fc){ this.frameCaller = fc; return this; }
    setFPSLimit(v){
        if(v <= 0){
            this._fpsLimit = 0;
            this._runPtr = this.runFull.bind(this);
        }else{
            this._fpsLimit = 1000/v; //Calc how many milliseconds per frame in one second of time.
            this._runPtr = this.runLimit.bind(this);
        }
    }

    runLimit(){
        //Calculate Deltatime between frames and the FPS currently.
        var msCurrent	= performance.now(),
            msDelta		= (msCurrent - this._lastFrame),
            deltaTime	= msDelta / 1000.0;		//What fraction of a single second is the delta time

        if(msDelta >= this._fpsLimit){ //Now execute frame since the time has elapsed.
            this.fps		= Math.floor(1/deltaTime);
            this._lastFrame	= msCurrent;
            this._callBack(deltaTime);
        }

        if(this.isActive) this._frameCaller.requestAnimationFrame(this._runPtr);
    }

    runFull(){
        //Calculate Deltatime between frames and the FPS currently.
        var msCurrent	= performance.now(),	//Gives you the whole number of how many milliseconds since the dawn of time :)
            deltaTime	= (msCurrent - this._lastFrame) / 1000.0;	//ms between frames, Then / by 1 second to get the fraction of a second.

        //Now execute frame since the time has elapsed.
        this.fps			= Math.floor(1/deltaTime); //Time it took to generate one frame, divide 1 by that to get how many frames in one second.
        this._lastFrame		= msCurrent;
        this._callBack(deltaTime);
        if(this.isActive)	this._frameCaller.requestAnimationFrame(this._runPtr);
    }
}

var Renderer = (function(){
    var material =null;
    var shader = null;

    return function(ary){
        for(var i=0; i < ary.length; i++){
            if(ary[i].visible == false) continue;

            //...................................
            //Check if the next materal to use is different from the last
            if(material !== ary[i].material){
                material = ary[i].material;

                //Multiple materials can share the same shader, if new shader, turn it on.
                if(material.shader !== shader) shader = material.shader.activate();


                // TODO TODO
                //Turn on/off any gl features
                // if(material.useCulling != CULLING_STATE)	gl[ ( (CULLING_STATE = (!CULLING_STATE))  )?"enable":"disable" ](gl.CULL_FACE);
                // if(material.useBlending != BLENDING_STATE)	gl[ ( (BLENDING_STATE = (!BLENDING_STATE)) )?"enable":"disable" ](gl.BLEND);
            }

            //...................................
            //Prepare Buffers and Uniforms.
            gl.bindVertexArray(ary[i].vao.id);
            if(material.useModelMatrix) material.shader.setUniforms(Constant.UNI_MODEL_MAT_NAME,ary[i].updateMatrix());
            //(material.useNormalMatrix)

            //...................................
            //Render !!!
            if(ary[i].vao.isIndexed)	gl.drawElements(material.drawMode, ary[i].vao.count, gl.UNSIGNED_SHORT, 0);
            else						gl.drawArrays(material.drawMode, 0, ary[i].vao.count);
        }

        //...................................
        //Cleanup
        gl.bindVertexArray(null); //After all done rendering, unbind VAO
    }
})();


export  {
    Renderer,
    RenderLoop
}

