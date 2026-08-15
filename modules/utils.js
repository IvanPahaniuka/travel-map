const singlePromisesByKey = {};

/**
 * @function
 * @template A
 * @template R
 * @param {string} key 
 * @param {(...args: A) => Promise<R>} func
 * @param {boolean} returnIfBusy
 * @returns {(...args: A) => Promise<R>}
 */
function createSingleExecutor(key, func, returnIfBusy = false) {
	return async (...args) => {
		if (returnIfBusy === true && singlePromisesByKey[key]) {
			return;
		}

		while (singlePromisesByKey[key]) {
			try {
				await singlePromisesByKey[key];
			} catch {}
		}

		return singlePromisesByKey[key] = func(...args)
			.finally(() => { singlePromisesByKey[key] = null; });
	};
}

const Utils = {
	createSingleExecutor,
};

export default Utils;