export default class Util{
    //Convert Hex colors to float arrays, can batch process a list into one big array.
    //example : Fungi.Util.rgbArray("#FF0000","00FF00","#0000FF");
    static rgbArray(){
        if(arguments.length == 0) return null;
        var rtn = [];

        for(var i=0,c,p; i < arguments.length; i++){
            if(arguments[i].length < 6) continue;
            c = arguments[i];		//Just an alias(copy really) of the color text, make code smaller.
            p = (c[0] == "#")?1:0;	//Determine starting position in char array to start pulling from

            rtn.push(
                parseInt(c[p]	+c[p+1],16)	/ 255.0,
                parseInt(c[p+2]	+c[p+3],16)	/ 255.0,
                parseInt(c[p+4]	+c[p+5],16)	/ 255.0
            );
        }
        return rtn;
    }

    //Normalize x value to x range, then normalize to lerp the z range.
    static map(x, xMin,xMax, zMin,zMax){ return (x - xMin) / (xMax - xMin) * (zMax-zMin) + zMin; }

    static clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

    static smoothStep(edge1, edge2, val){ //https://en.wikipedia.org/wiki/Smoothstep
        var x = Math.max(0, Math.min(1, (val-edge1)/(edge2-edge1)));
        return x*x*(3-2*x);
    }
}
