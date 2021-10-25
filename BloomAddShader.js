var BloomAddShader = {

    uniforms: {

        'sceneDiffuse': { value: null },
        'tDiffuse': { value: null },
        'bloomAmt': { value: null }
    },

    vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

    fragmentShader: /* glsl */ `
		uniform float opacity;
        uniform float bloomAmt;
		uniform sampler2D sceneDiffuse;
        uniform sampler2D tDiffuse;
		varying vec2 vUv;
		void main() {
			vec4 texel = texture2D( sceneDiffuse, vUv );
            vec4 bloomTexel = texture2D( tDiffuse, vUv );
            gl_FragColor = texel + bloomAmt * bloomTexel;
		}`

};

export { BloomAddShader };