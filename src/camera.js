import {Transform} from "./object"
import Constant from "./constant"
import Resource from "./resource"
import Maths from "./math"


export default class CameraOrbit extends Transform{
    constructor(fov,near,far){
        super();

        if (gl === null){window.alert("Init gl firstly")}

        //Setup the projection and invert matrices
        this.ubo = Resource.Ubo[Constant.UBO_TRANSFORM];
        this.projectionMatrix = new Float32Array(16);
        this.invertedLocalMatrix = new Float32Array(16);

        let ratio = gl.canvas.width / gl.canvas.height;
        Maths.Matrix4.perspective(this.projectionMatrix, fov || 45, ratio, near || 0.1, far || 100.0);
        this.ubo.update("matProjection",this.projectionMatrix); //Initialize The Transform UBO.

        //Orbit Camera will control things based on euler, its cheating but not ready for quaternions
        this.euler = new Maths.Vec3();
    }

    //Override how this transfer creates the localMatrix : Call Update, not this function in render loop.
    updateMatrix(){
        //Only Update the Matrix if its needed.
        //if(!this.position.isModified && !this.rotation.isModified && !this.euler.isModified) return this.localMatrix;

        Maths.Quaternion.setFromEuler(this.rotation,this.euler.x,this.euler.y,this.euler.z,"YXZ");
        Maths.Matrix4.fromQuaternion(this.localMatrix,this.rotation);
        this.localMatrix.resetTranslation().translate(this.position);

        //Set the modified indicator to false on all the transforms.
        this.position.isModified	= false;
        this.rotation.isModified	= false;
        this.euler.isModified		= false;
        return this.localMatrix;
    }

    //Update the Matrices and UBO.
    update(){
        if(this.position.isModified || this.scale.isModified || this.euler.isModified) this.updateMatrix();

        Maths.Matrix4.invert(this.invertedLocalMatrix,this.localMatrix);
        this.ubo.update("matCameraView",this.invertedLocalMatrix);
    }

    setEulerDegrees(x,y,z){
        this.euler.set(x * Constant.DEG2RAD,y * Constant.DEG2RAD,z * Constant.DEG2RAD); return this;
    }
}