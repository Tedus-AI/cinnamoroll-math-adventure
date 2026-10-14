/**
 * Math module contract:
 * {id, title, version, answerFields, generate({tier}, rng),
 *  validate(question, {quotient,remainder}), steps(question)}
 * New modules plug into this registry; gameplay rewards remain in engine.js.
 */
const registry=new Map();
export function registerMathModule(module){
 if(!module?.id||typeof module.generate!=="function"||typeof module.validate!=="function")throw new Error("Invalid math module");
 if(registry.has(module.id))throw new Error("Duplicate math module: "+module.id);
 registry.set(module.id,Object.freeze(module));
}
export function mathModule(id){const module=registry.get(id);if(!module)throw new Error("這個數學主題尚未開放");return module;}
export function mathModuleIds(){return [...registry.keys()];}
