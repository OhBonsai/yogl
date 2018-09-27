import Resource from "./resource"
import Maths from "./math"


class Transform{
    constructor(){
        //Transformation Data
        this.position = new Maths.Vec3(0);
        this.scale = new Maths.Vec3(1);
        this.rotation = new Maths.Quaternion();
        this.localMatrix = new Maths.Matrix4();

        //Parent / Child Relations
        this.children = [];
        this._parent = null;
    }

    //----------------------------------------------
    //region Setters/Getters
    /*

    //R  T  F  T    
    //00 04 08 12
    //01 05 09 13
    //02 06 10 14
    //03 07 11 15
    right(d){	return this._getDirection(0,1,2,d);	}
    top(d){		return this._getDirection(4,5,6,d);	}
    forward(d){	return this._getDirection(8,9,10,d);}
    _getDirection(xi,yi,zi,d){
        this.updateMatrix();
        d = d || 1; //Distance
        let x = this.localMatrix[xi], y = this.localMatrix[yi], z = this.localMatrix[zi],
            m =  Math.sqrt( x*x + y*y + z*z );
        return [ x/m*d, y/m*d, z/m*d ];
    }
    */
    forward(v){
        v = v || new Maths.Vec3(); v.set(0,0,1);
        Maths.Quaternion.multiVec3(v,this.rotation,v);
        return v;
    }

    top(v){
        v = v || new Maths.Vec3(); v.set(0,1,0);
        Maths.Quaternion.multiVec3(v,this.rotation,v);
        return v;
    }

    left(v){
        v = v || new Maths.Vec3(); v.set(1,0,0);
        Maths.Quaternion.multiVec3(v,this.rotation,v);
        return v;
    }

    get parent(){ this._parent; }
    set parent(p){
        if(this._parent != null){
            //this._parent.removeChild(this);
        }

        this._parent = p;
        //this._parent.addChild(this);
    }

    //Chaining functions, useful for initializing
    setPosition(x,y,z){	this.position.set(x,y,z);	return this; }
    setScale(x,y,z){	this.scale.set(x,y,z);		return this; }

    //setRadX(rad){	this.rotation.rx(rad);	return this; }
    //setRadY(rad){	this.rotation.ry(rad);	return this; }
    //setRadZ(rad){	this.rotation.rz(rad);	return this; }
    //setDegX(deg){	this.rotation.ex(deg);	return this; }
    //setDegY(deg){	this.rotation.ey(deg);	return this; }
    //setDegZ(deg){	this.rotation.ez(deg);	return this; }
    //endregion

    //----------------------------------------------
    //region Methods
    updateMatrix(){
        //Only Update the Matrix if its needed.
        if(!this.position.isModified && !this.scale.isModified && !this.rotation.isModified) return this.localMatrix;

        //Update our local Matrix
        Maths.Matrix4.fromQuaternionTranslationScale(this.localMatrix, this.rotation, this.position, this.scale);

        //Set the modified indicator to false on all the transforms.
        this.position.isModified	= false;
        this.scale.isModified		= false;
        this.rotation.isModified	= false;
        return this.localMatrix;
    }

    addChild(c){ c.parent = this; this.children.push(c); return this; }

    removeChild(c){ return this; }
    //endregion
}

class O3d extends Transform{
    constructor(vao,matName){
        super();
        this.vao = vao;
        this.visible = true;
        this.material = Resource.Materials[matName];
    }
}

export default O3d
export {
    O3d,
    Transform
}