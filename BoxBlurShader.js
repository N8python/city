var BoxBlurShader = {

    uniforms: {

        'tDiffuse': { value: null },
        'resolution': { value: null }

    },

    vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

    fragmentShader: /* glsl */ `
		uniform float opacity;
		uniform sampler2D tDiffuse;
        uniform vec2 resolution;
		varying vec2 vUv;
		void main() {
            const float directions = 16.0;
            const float quality = 3.0;
            const float size = 8.0;
            const float pi = 3.14159;
            vec2 radius = size/resolution;
			vec4 color = texture2D( tDiffuse, vUv );
            for(float d =0.0; d < pi * 2.0; d+=(pi * 2.0) / directions) {
                for(float i = 1.0/quality; i<=1.0; i+=1.0/quality) {
                    color += texture2D(tDiffuse, vUv+vec2(cos(d), sin(d)) * radius * i);
                }
            }
            color /= quality * directions - 15.0;
			gl_FragColor = color;
		}`

};

export { BoxBlurShader };