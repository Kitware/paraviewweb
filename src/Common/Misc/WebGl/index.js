// Show GL informations
export function showGlInfo(gl) {
    var vertexUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
    var fragmentUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    var combinedUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    console.log("vertex texture image units: " + vertexUnits);
    console.log("fragment texture image units: " + fragmentUnits);
    console.log("combined texture image units: " + combinedUnits);
}

// Compile a shader
function compileShader(gl, src, type) {
    var shader = gl.createShader( type );

    gl.shaderSource( shader, src );

    // Compile and check status
    gl.compileShader( shader );
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        // Something went wrong during compilation; get the error
        const lastError = gl.getShaderInfoLog(shader);
        console.error( "Error compiling shader '" + shader + "':" + lastError );
        gl.deleteShader( shader );

        return null;
    }

    return shader;
}

// Create a shader program
function createShaderProgram(gl, shaders) {
  var program = gl.createProgram();

  for(let i = 0; i < shaders.length; i+=1) {
    gl.attachShader( program, shaders[ i ] );
  }

  gl.linkProgram( program );

  // Check the link status
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    // something went wrong with the link
    const lastError = gl.getProgramInfoLog (program);
    console.error("Error in program linking:" + lastError);
    gl.deleteProgram(program);

    return null;
  }

  program.shaders = shaders;
  gl.useProgram(program);

  return program;
}

// Apply new mapping to a program
export function applyProgramDataMapping(gl, programName, mappingName, glConfig, glResources) {
    var program = glResources.programs[programName],
        mapping = glConfig.mappings[mappingName];

    mapping.forEach(function(bufferMapping) {
        var glBuffer = glResources.buffers[bufferMapping.id];

        gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
        program[bufferMapping.name] = gl.getAttribLocation(program, bufferMapping.attribute);
        gl.enableVertexAttribArray(program[bufferMapping.name]);
        gl.vertexAttribPointer.apply(gl, [ program[bufferMapping.name] ].concat(bufferMapping.format));
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    });
}

// Create a shader program
function buildShaderProgram(gl, name, config, resources) {
    var progConfig = config.programs[name],
        compiledVertexShader = compileShader(gl, progConfig.vertexShader, gl.VERTEX_SHADER),
        compiledFragmentShader = compileShader(gl, progConfig.fragmentShader, gl.FRAGMENT_SHADER),
        program = createShaderProgram(gl, [compiledVertexShader, compiledFragmentShader]);

    // Store the created program in the resources
    resources.programs[name] = program;

    // Handle mapping if any
    if(progConfig.mapping) {
        applyProgramDataMapping(gl, name, progConfig.mapping, config, resources);
    }

    // Return program
    return program;
}

// Bind texture to Framebuffer
export function bindTextureToFramebuffer(gl, fbo, texture) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D,
                  0, gl.RGBA, fbo.width, fbo.height,
                  0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                            gl.TEXTURE_2D, texture, 0);

  // Check fbo status
  const fbs = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (fbs !== gl.FRAMEBUFFER_COMPLETE) {
        console.log("ERROR: There is a problem with the framebuffer: " + fbs);
  }

  // Clear the bindings we created in this function.
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// Free GL resources
function freeGLResources(glResources) {
    var gl = glResources.gl;

    // Delete each program
    for(const programName in glResources.programs) {
        const program = glResources.programs[programName],
            shaders = program.shaders;

        let count = shaders.length;

        // Delete shaders
        while(count--) {
            gl.deleteShader(shaders[count]);
        }

        // Delete program
        gl.deleteProgram(program);
    }

    // Delete framebuffers
    for(const fbName in glResources.framebuffers) {
        gl.deleteFramebuffer(glResources.framebuffers[fbName]);
    }

    // Delete textures
    for(const textureName in glResources.textures) {
        gl.deleteTexture(glResources.textures[textureName]);
    }

    // Delete buffers
    for(const bufferName in glResources.buffers) {
        gl.deleteBuffer(glResources.buffers[bufferName]);
    }
}

// Create GL resources
export function createGLResources(gl, glConfig) {
    var resources = { gl, buffers: {}, textures: {}, framebuffers: {}, programs: {} },
        buffers = glConfig.resources.buffers || [],
        textures = glConfig.resources.textures || [],
        framebuffers = glConfig.resources.framebuffers || [];

    // Create Buffer
    buffers.forEach(function(buffer) {
        var glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, buffer.data, gl.STATIC_DRAW);
        resources.buffers[buffer.id] = glBuffer;
    });

    // Create Texture
    textures.forEach(function(texture) {
        var glTexture = gl.createTexture(),
            pixelStore = texture.pixelStore || [],
            texParameter = texture.texParameter || [];

        gl.bindTexture(gl.TEXTURE_2D, glTexture);

        pixelStore.forEach(function(option) {
            gl.pixelStorei(gl[option[0]], option[1]);
        });

        texParameter.forEach(function(option) {
            gl.texParameteri(gl.TEXTURE_2D, gl[option[0]], gl[option[1]]);
        });

        resources.textures[texture.id] = glTexture;
    });

    // Create Framebuffer
    framebuffers.forEach(function(framebuffer) {
        var glFramebuffer = gl.createFramebuffer();
        glFramebuffer.width = framebuffer.width;
        glFramebuffer.height = framebuffer.height;

        resources.framebuffers[framebuffer.id] = glFramebuffer;
    });

    // Create programs
    for(const programName in glConfig.programs) {
        buildShaderProgram(gl, programName, glConfig, resources);
    }

    // Add destroy function
    resources.destroy = function() { freeGLResources(resources); };

    return resources;
}

//----------------------------------------------------------------------------

export function transformShader(shaderString, variableDict, config) {
    var match = null,
        unrolledContents = null;

    // First do all the variable replacements
    for (const vname in variableDict) {
        const value = variableDict[vname],
            r = new RegExp("\\$\\{" + vname + "\\}", 'g');
        shaderString = shaderString.replace(r, value);
    }

    // Now check if any loops need to be inlined
    if (config.inlineLoops) {
        const loopRegex = /\/\/@INLINE_LOOP([\s\S]+?)(?=\/\/@INLINE_LOOP)\/\/@INLINE_LOOP/;

        match = shaderString.match(loopRegex);
        while (match) {
            const capture = match[1],
                infoRegex = /^\s*\(([^\),]+)\s*,\s*([^\),]+)\s*,\s*([^\)]+)\)/,
                infoRegexMatch = capture.match(infoRegex),
                loopVariableName = infoRegexMatch[1],
                loopMin = infoRegexMatch[2],
                loopCount = infoRegexMatch[3],
                forLoop = capture.replace(infoRegex, ''),
                loopContentsRegex = /^\s*[^\{]+\{([\s\S]+?)\s*\}\s*$/,
                forLoopMatch = forLoop.match(loopContentsRegex),
                loopBody = forLoopMatch[1],
                loopBodyReplacer = new RegExp(loopVariableName, 'g');

            unrolledContents = "";
            for (let i = loopMin; i < loopCount; ++i) {
                unrolledContents += loopBody.replace(loopBodyReplacer, i);
                unrolledContents += '\n';
            }

            shaderString = shaderString.replace(loopRegex, unrolledContents);
            match = shaderString.match(loopRegex);
        }
    }

    if (config.debug) {
        console.log("Transformed shader string:");
        console.log(shaderString);
    }

    return shaderString;
}

//----------------------------------------------------------------------------

export default {
    applyProgramDataMapping,
    bindTextureToFramebuffer,
    createGLResources,
    showGlInfo,
    transformShader,
}
