export class ShaderNoiseField {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private fbos: { framebuffer: WebGLFramebuffer; texture: WebGLTexture }[] = [];
  private currentFbo = 0;
  private uniforms: Record<string, WebGLUniformLocation> = {};
  private startTime: number;
  private mouse = { x: 0, y: 0 };
  private raf = 0;
  private resizeObserver: ResizeObserver;
  private lowRes: boolean;

  constructor(canvas: HTMLCanvasElement, lowRes = false) {
    this.canvas = canvas;
    this.lowRes = lowRes;
    this.startTime = performance.now();

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    this.program = this.createProgram();
    this.uniforms = this.getUniforms();
    this.resize();
    this.fbos = [this.createFbo(), this.createFbo()];

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scale = this.lowRes ? 0.25 : 1;
      this.mouse.x = (e.clientX - rect.left) * scale;
      this.mouse.y = (e.clientY - rect.top) * scale;
    });
  }

  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;

    // Patch octave count for low-res mode
    if (this.lowRes && type === gl.FRAGMENT_SHADER) {
      source = source.replace(/fbm\(([^,]+),\s*6\)/g, 'fbm($1, 3)');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compile error: ${info}`);
    }
    return shader;
  }

  private createProgram(): WebGLProgram {
    const gl = this.gl;
    const program = gl.createProgram()!;

    const vertSrc = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  float x = float((gl_VertexID & 1) << 2);
  float y = float((gl_VertexID & 2) << 1);
  vUv = vec2(x * 0.5, y * 0.5);
  gl_Position = vec4(x - 1.0, y - 1.0, 0.0, 1.0);
}`;

    const fragSrc = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform sampler2D u_feedback;
in vec2 vUv;
out vec4 fragColor;

vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+10.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 105.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float fbm(vec3 p,int octaves){
  float v=0.,a=.5,f=1.;
  for(int i=0;i<8;i++){
    if(i>=octaves)break;
    v+=a*snoise(p*f);
    f*=2.;a*=.5;
  }
  return v;
}

vec3 palette(float t){
  vec3 a=vec3(.5);vec3 b=vec3(.5);
  vec3 c=vec3(1.);vec3 d=vec3(0.,.1,.2);
  return a+b*cos(6.28318*(c*t+d));
}

void main(){
  vec2 uv=vUv;
  vec2 aspect=vec2(u_resolution.x/u_resolution.y,1.);
  vec2 p=uv*aspect;
  float t=u_time*.08;
  vec2 mUv=u_mouse/u_resolution;
  mUv.y=1.-mUv.y;
  vec2 mP=mUv*aspect;
  float mD=length(p-mP);
  float mI=smoothstep(.5,0.,mD)*.4;
  vec3 q=vec3(p*1.5,t);
  float w1=fbm(q+vec3(1.7,9.2,0.),6);
  float w2=fbm(q+vec3(8.3,2.8,0.),6);
  vec3 warped=vec3(p.x+w1*.4+mI*sin(t*3.),p.y+w2*.4+mI*cos(t*2.),t);
  float n=fbm(warped*2.,6);
  vec3 col=palette(n*.8+t*.3);
  col*=.7+.3*n;
  col=pow(col,vec3(.9));
  vec4 fb=texture(u_feedback,uv);
  vec3 result=mix(col,fb.rgb,.88);
  float vig=1.-.3*length(uv-.5);
  result*=vig;
  fragColor=vec4(result,1.);
}`;

    const vs = this.createShader(gl.VERTEX_SHADER, vertSrc);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fragSrc);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.useProgram(program);
    return program;
  }

  private getUniforms(): Record<string, WebGLUniformLocation> {
    const gl = this.gl;
    return {
      u_time: gl.getUniformLocation(this.program, 'u_time')!,
      u_resolution: gl.getUniformLocation(this.program, 'u_resolution')!,
      u_mouse: gl.getUniformLocation(this.program, 'u_mouse')!,
      u_feedback: gl.getUniformLocation(this.program, 'u_feedback')!,
    };
  }

  private createFbo() {
    const gl = this.gl;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.canvas.width, this.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const framebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { framebuffer, texture };
  }

  private resize() {
    const scale = this.lowRes ? 0.25 : window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * scale;
    this.canvas.height = rect.height * scale;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // Recreate FBOs on resize
    if (this.fbos.length > 0) {
      this.fbos.forEach((fbo) => {
        this.gl.deleteFramebuffer(fbo.framebuffer);
        this.gl.deleteTexture(fbo.texture);
      });
      this.fbos = [this.createFbo(), this.createFbo()];
    }
  }

  start() {
    const render = () => {
      const gl = this.gl;
      const time = (performance.now() - this.startTime) / 1000;

      const src = this.fbos[this.currentFbo];
      const dst = this.fbos[1 - this.currentFbo];

      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
      gl.useProgram(this.program);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src.texture);
      gl.uniform1i(this.uniforms.u_feedback, 0);

      gl.uniform1f(this.uniforms.u_time, time);
      gl.uniform2f(this.uniforms.u_resolution, this.canvas.width, this.canvas.height);
      gl.uniform2f(this.uniforms.u_mouse, this.mouse.x, this.mouse.y);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Blit to screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, dst.framebuffer);
      gl.blitFramebuffer(
        0, 0, this.canvas.width, this.canvas.height,
        0, 0, this.canvas.width, this.canvas.height,
        gl.COLOR_BUFFER_BIT, gl.NEAREST
      );
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);

      this.currentFbo = 1 - this.currentFbo;
      this.raf = requestAnimationFrame(render);
    };

    this.raf = requestAnimationFrame(render);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.fbos.forEach((fbo) => {
      this.gl.deleteFramebuffer(fbo.framebuffer);
      this.gl.deleteTexture(fbo.texture);
    });
    this.gl.deleteProgram(this.program);
  }
}
