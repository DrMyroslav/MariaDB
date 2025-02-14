module.exports = _ => {
	const checkFieldPropertiesChanged = (compMod, propertiesToCheck) => {
		return propertiesToCheck.some(prop => compMod?.oldField[prop] !== compMod?.newField[prop]);
	};

	const modifyGroupItems = ({ data, key, hydrate, drop, create }) => {
		const compMod = getCompMod(data);
		const parentName = data.code || data.name || data.collectionName;

		const { removed, added, modified } = getModifiedGroupItems(compMod[key] || {}, hydrate);

		const removedScripts = removed.map(item => drop(parentName, item));
		const addedScripts = added.map(item => create(parentName, item));
		const modifiedScripts = modified.map(item => create(parentName, { ...item, orReplace: true }));

		return [].concat(modifiedScripts).concat(removedScripts).concat(addedScripts).filter(Boolean).join('\n\n');
	};

	const getModifiedGroupItems = ({ new: newItems = [], old: oldItems = [] }, hydrate) => {
		const oldHydrated = oldItems.map(hydrate);
		const newHydrated = newItems.map(hydrate);

		const { removed, added, modified } = oldHydrated.reduce(
			(accumulator, oldItem) => {
				const newItem = newHydrated.find(item => item.name === oldItem.name);
				const itemsAreNotEqual = !isGroupItemsEqual(newItem, oldItem);

				if (!newItem) {
					return {
						removed: [...accumulator.removed, oldItem],
						modified: accumulator.modified,
						added: accumulator.added,
					};
				}

				if (itemsAreNotEqual) {
					return {
						removed: accumulator.removed,
						modified: [...accumulator.modified, newItem],
						added: accumulator.added,
					};
				}

				return accumulator;
			},
			{
				removed: [],
				modified: [],
				added: newHydrated.filter(newItem => !oldHydrated.some(item => item.name === newItem.name)),
			},
		);

		return { removed, added, modified };
	};

	const isGroupItemsEqual = (leftItem, rightItem) => _.isEqual(leftItem, rightItem);

	const getCompMod = containerData => containerData.role?.compMod ?? {};

	const checkCompModEqual = ({ new: newItem, old: oldItem } = {}, _) => _.isEqual(newItem, oldItem);

	return {
		checkFieldPropertiesChanged,
		getCompMod,
		modifyGroupItems,
		checkCompModEqual,
	};
};
