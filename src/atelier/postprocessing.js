/*
 * postprocessing.js — Le "look" cinéma : profondeur de champ et bloom.
 * Au lieu de dessiner la scène directement à l'écran, on la dessine dans
 * une image intermédiaire, puis on applique des filtres les uns après les autres,
 * comme des calques dans un logiciel de retouche photo.
 */
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export function createPostProcessing({ renderer, scene, camera, sizes, params }) {
  // Image intermédiaire en haute précision (HalfFloat) pour garder les lumières
  // très fortes (> 1) dont le bloom a besoin, avec anti-crénelage (samples: 4)
  const renderTarget = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
    type: THREE.HalfFloatType,
    samples: 4,
  })

  const composer = new EffectComposer(renderer, renderTarget)
  composer.setPixelRatio(renderer.getPixelRatio())
  composer.setSize(sizes.width, sizes.height)

  // Calque 1 : la scène normale
  const renderPass = new RenderPass(scene, camera)

  // Calque 2 : profondeur de champ (net à la distance "focus", flou ailleurs)
  const bokehPass = new BokehPass(scene, camera, {
    focus: 5,
    aperture: params.aperture,
    maxblur: params.maxBlur,
  })

  // Calque 3 : bloom (halo autour de ce qui est très lumineux)
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(sizes.width, sizes.height),
    params.bloomStrength, // force du halo
    params.bloomRadius, // étalement du halo
    params.bloomThreshold // seuil : seules les zones plus lumineuses brillent
  )

  // Calque 4 : conversion finale des couleurs pour l'écran (tone mapping + sRGB)
  const outputPass = new OutputPass()

  composer.addPass(renderPass)
  composer.addPass(bokehPass)
  composer.addPass(bloomPass)
  composer.addPass(outputPass)

  // Mise au point : distance entre la caméra et ce qu'on veut voir net
  function setFocus(distance) {
    bokehPass.uniforms.focus.value = distance
  }

  function resize() {
    composer.setPixelRatio(renderer.getPixelRatio())
    composer.setSize(sizes.width, sizes.height)
    bloomPass.resolution.set(sizes.width, sizes.height)
  }

  return {
    composer,
    bokehPass,
    bloomPass,
    setFocus,
    resize,
    render: () => composer.render(),
  }
}
