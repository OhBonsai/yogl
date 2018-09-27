import Resource from "./resource"
import Constant from "./constant"


export default class UBO{

    constructor(blockName,blockPoint,bufSize,aryCalc){
        //Build name indexed array of Buffer Components for quick access when updating.
        this.items = [];	//Key Indexed array of structs that define each component
        this.keys = [];		//The order is important for the struct, keep the order of the uniform names with this array.

        for(let i=0; i < aryCalc.length; i++){
            this.items[aryCalc[i].name]	= {offset: aryCalc[i].offset,dataLen: aryCalc[i].dataLen,chunkLen:aryCalc[i].chunkLen};
            this.keys[i]				= aryCalc[i].name;
        }

        //Save some extra bits of data
        this.blockName = blockName;
        this.blockPoint = blockPoint;

        //Create Buffer to store the struct data.
        this.buf = gl.createBuffer();									//Create Standard Buffer
        gl.bindBuffer(gl.UNIFORM_BUFFER,this.buf);						//Bind it for work
        gl.bufferData(gl.UNIFORM_BUFFER,bufSize,gl.DYNAMIC_DRAW);		//Allocate Space needed
        gl.bindBuffer(gl.UNIFORM_BUFFER,null);							//Unbind
        gl.bindBufferBase(gl.UNIFORM_BUFFER, blockPoint, this.buf);		//Assign to Block Point
    }

    update(name,data){
        //If not float32array, make it so
        //if(! (data instanceof Float32Array)){
        //	if(Array.isArray(data))	data = new Float32Array(data);		//already an array, just convert to float32
        //	else 					data = new Float32Array([data]);	//Single value most likely,Turn to -> Array -> Float32Ary
        //}

        gl.bindBuffer(gl.UNIFORM_BUFFER,this.buf);
        gl.bufferSubData(gl.UNIFORM_BUFFER, this.items[name].offset, data, 0, null);
        gl.bindBuffer(gl.UNIFORM_BUFFER,null);
        return this;
    }

    static createTransformUBO(){
        return UBO.create(Constant.UBO_TRANSFORM,0,[ {name:"matProjection",type:"mat4"}, {name:"matCameraView",type:"mat4"} ]);
    }

    static create(blockName,blockPoint,ary){
        let bufSize = UBO.calculate(ary);
        Resource.Ubo[blockName] = new UBO(blockName,blockPoint,bufSize,ary);
        UBO.debugVisualize(Resource.Ubo[blockName]);
        return Resource.Ubo[blockName];
    }

    static getSize(type){ //[Alignment,Size]
        switch(type){
            case "f": case "i": case "b": return [4,4];
            case "mat4": return [64,64]; //16*4
            case "mat3": return [48,48]; //16*3
            case "vec2": return [8,8];
            case "vec3": return [16,12]; //Special Case
            case "vec4": return [16,16];
            default: return [0,0];
        }
    }

    static calculate(ary){
        let chunk = 16,	//Data size in Bytes, UBO using layout std140 needs to build out the struct in chunks of 16 bytes.
            tsize = 0,	//Temp Size, How much of the chunk is available after removing the data size from it
            offset = 0,	//Offset in the buffer allocation
            size;		//Data Size of the current type

        for(let i=0; i < ary.length; i++){
            //When dealing with arrays, Each element takes up 16 bytes regardless of type.
            if(!ary[i].arylen || ary[i].arylen === 0) size = UBO.getSize(ary[i].type);
            else size = [ary[i].arylen * 16,ary[i].arylen * 16];

            tsize = chunk-size[0];	//How much of the chunk exists after taking the size of the data.

            //Chunk has been overdrawn when it already has some data resurved for it.
            if(tsize < 0 && chunk < 16){
                offset += chunk;						//Add Remaining Chunk to offset...
                if(i > 0) ary[i-1].chunkLen += chunk;	//So the remaining chunk can be used by the last letiable
                chunk = 16;								//Reset Chunk
            }else if(tsize < 0 && chunk === 16){
                //Do nothing incase data length is >= to unused chunk size.
                //Do not want to change the chunk size at all when this happens.
            }else if(tsize === 0){ //If evenly closes out the chunk, reset

                if(ary[i].type === "vec3" && chunk === 16) chunk -= size[1];	//If Vec3 is the first let in the chunk, subtract size since size and alignment is different.
                else chunk = 16;

            }else chunk -= size[1];	//Chunk isn't filled, just remove a piece

            //Add some data of how the chunk will exist in the buffer.
            ary[i].offset	= offset;
            ary[i].chunkLen	= size[1];
            ary[i].dataLen	= size[1];

            offset += size[1];
        }

        //Check if the final offset is divisiable by 16, if not add remaining chunk space to last element.
        //if(offset % 16 !== 0){
        //ary[ary.length-1].chunkLen += 16 - offset % 16;
        //offset += 16 - offset % 16;
        //}

        //console.log("UBO Buffer Size ",offset);
        return offset;
    }

    static debugVisualize(ubo){
        let str = "",
            chunk = 0,
            tchunk = 0,
            itm = null;

        for(let i=0; i < ubo.keys.length; i++){
            itm = ubo.items[ubo.keys[i]];
            console.log(ubo.keys[i],itm);

            chunk = itm.chunkLen / 4;
            for(let x = 0; x < chunk; x++){
                str += (x===0 || x === chunk-1)? "|."+i+"." : "|...";	//Display the index
                tchunk++;
                if(tchunk % 4 === 0) str += "| ~ ";
            }
        }

        if(tchunk % 4 !== 0) str += "|";

        //console.log(str);
        //for(let i=0; i < ary.length; i++) console.log(ary[i]);
    }
}