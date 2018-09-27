import Resource from "./resource"
import Constant from "./constant"


export default class VAO{
    static create(out){
        out.buffers = [];
        out.id = gl.createVertexArray();
        out.isIndexed = false;
        out.count = 0;

        gl.bindVertexArray(out.id);
        return VAO;
    }

    static finalize(out,name){
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER,null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,null);
        Resource.Vao[name] = out;
    }

    static emptyFloatArrayBuffer(out,name,aryCount,attrLoc,size,stride,offset,isStatic){
        let rtn = {
            buf:gl.createBuffer(),
            size:size,
            stride:stride,
            offset:offset,
            count:0
        };

        gl.bindBuffer(gl.ARRAY_BUFFER, rtn.buf);
        gl.bufferData(gl.ARRAY_BUFFER,aryCount,(isStatic !== false)? gl.STATIC_DRAW : gl.DYNAMIC_DRAW);		//Allocate Space needed
        gl.enableVertexAttribArray(attrLoc);
        gl.vertexAttribPointer(attrLoc,size,gl.FLOAT,false,stride || 0,offset || 0);

        out.buffers[name] = rtn;
        return VAO;
    }

    static floatArrayBuffer(out,name,aryFloat,attrLoc,size,stride,offset,isStatic,keepData){
        let rtn = {
            buf:gl.createBuffer(),
            size:size,
            stride:stride,
            offset:offset,
            count:aryFloat.length / size
        };
        if(keepData === true) rtn.data = aryFloat;
        let ary = (aryFloat instanceof Float32Array)? aryFloat : new Float32Array(aryFloat);

        gl.bindBuffer(gl.ARRAY_BUFFER, rtn.buf);
        gl.bufferData(gl.ARRAY_BUFFER, ary, (isStatic !== false)? gl.STATIC_DRAW : gl.DYNAMIC_DRAW );
        gl.enableVertexAttribArray(attrLoc);
        gl.vertexAttribPointer(attrLoc,size,gl.FLOAT,false,stride || 0,offset || 0);

        out.buffers[name] = rtn;
        return VAO;
    }

    static indexBuffer(out,name,aryUInt,isStatic,keepData){
        let rtn = { buf:gl.createBuffer(), count:aryUInt.length };
        if(keepData === true) rtn.data = aryUInt;

        let ary = (aryUInt instanceof Uint16Array)? aryUInt : new Uint16Array(aryUInt);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rtn.buf );
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ary, (isStatic !== false)? gl.STATIC_DRAW : gl.DYNAMIC_DRAW );

        out.buffers[name] = rtn;
        out.isIndexed = true;
        out.count = aryUInt.length;

        return VAO;
    }

    static standardMesh(name,vertSize,aryVert,aryNorm,aryUV,aryInd,keepData){
        let rtn = {};
        VAO.create(rtn).floatArrayBuffer(rtn,"vert",aryVert,Constant.ATTR_POSITION_LOC,vertSize,0,0,true,keepData);
        rtn.count = rtn.buffers["vert"].count;

        if(aryNorm)	VAO.floatArrayBuffer(rtn,"norm",aryNorm,Constant.ATTR_NORM_LOC,3,0,0,true,keepData);
        if(aryUV)	VAO.floatArrayBuffer(rtn,"uv",aryUV,Constant.ATTR_UV_LOC,2,0,0,true,keepData);
        if(aryInd)	VAO.indexBuffer(rtn,"index",aryInd,true,keepData);

        VAO.finalize(rtn);
        return rtn;
    }
}
