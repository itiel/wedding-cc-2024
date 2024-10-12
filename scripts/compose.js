export const composeHTML = async (tagName = "div", attributes = null, children = null) => {
  const element = isNode(tagName) ? tagName : await createElement(tagName)
  
  await applyAttributes(element, attributes)
  await appendChildren(children, element)

  return element
}

const createElement = async (tagName) => (
  tagName.startsWith("svg:") ? 
    document.createElementNS("http://www.w3.org/2000/svg", tagName.substring(4)) :
    document.createElement(tagName)
)

const applyAttributes = async (element, attributes) => {
  if (isPromise(attributes)) 
    await applyAttributes(element, await attributes)
  else if (isFunction(attributes))
    await applyAttributes(element, attributes(element))
  else
    await eachIn(attributes, async (name, val) => 
      await handleSingleAttribute(element, name, val))
}

const handleSingleAttribute = async (element, name, val) => {
  if (name === "dataSet") 
    await handleDataSet(element, val)
  else if (name === "ariaSet") 
    await handleAriaSet(element, val)
  else if (name === "classList")
    await handleClassList(element, val)
  else if (name === "style")
    await handleStyleProperties(element, val)
  else if (name === "on") 
    await handleEventCallbacks(element, val)
  else if (name.startsWith("$"))
    await handleNonFormattedAttribute(element, name.substring(1), val)
  else
    await handleFormattedAttribute(element, name, val)
}

const handleDataSet = async (element, set) => {
  if (isPromise(set)) 
    await handleDataSet(element, await set)
  else if (isFunction(set))
    await handleDataSet(element, set(element))
  else
    await eachIn(set, async (name, val) => 
      await handleSingleDataAttribute(element, name, val))
}

const handleSingleDataAttribute = async (element, name, val) => {
  if (isPromise(val)) 
    await handleSingleDataAttribute(element, name, await val)
  else if (isFunction(val))
    await handleSingleDataAttribute(element, name, val(element, name))
  else
    element.dataset[name] = val
}

const handleAriaSet = async (element, set) => {
  if (isPromise(set)) 
    await handleAriaSet(element, await set)
  else if (isFunction(set))
    await handleAriaSet(element, set(element))
  else
    await eachIn(set, async (name, val) => 
      await handleSingleAriaAttribute(element, name, val))
}

const handleSingleAriaAttribute = async (element, name, val) => {
  if (isPromise(val)) 
    await handleSingleAriaAttribute(element, name, await val)
  else if (isFunction(val))
    await handleSingleAriaAttribute(element, name, val(element, name))
  else
    element.setAttribute(`aria-${name.toLowerCase()}`, val)
}

const handleClassList = async (element, list) => {
  if (isPromise(list)) 
    await handleClassList(element, await list)
  else if (isFunction(list))
    await handleClassList(element, list(element))
  else
    list.forEach(async (name) => 
      await handleSingleClassName(element, name))
}

const handleSingleClassName = async (element, name) => {
  if (isPromise(name)) 
    await handleSingleClassName(element, await name)
  else if (isFunction(name))
    await handleSingleClassName(element, name(element))
  else
    element.classList.add(name)
}

const handleStyleProperties = async (element, properties) => {
  if (isPromise(properties)) 
    await handleClassList(element, await properties)
  else if (isFunction(properties))
    await handleClassList(element, properties(element))
  else
    await eachIn(properties, async (name, val) => 
      await handleSingleStyleProperty(element, name, val))
}

const handleSingleStyleProperty = async (element, name, val) => {
  if (isPromise(val)) 
    await handleSingleStyleProperty(element, name, await val)
  else if (isFunction(val))
    await handleSingleStyleProperty(element, name, val(element, name))
  else
    element.style.setProperty(name, val)
}

const handleEventCallbacks = async (element, set) => {
  if (isPromise(set)) 
    await handleEventCallbacks(element, await set)
  else if (isFunction(set))
    await handleEventCallbacks(element, set(element))
  else
    await eachIn(set, async (eventName, callback) => 
      await handleSingleEventCallback(element, eventName, callback))
}

const handleSingleEventCallback = async (element, eventName, callback) => {
  if (isPromise(callback)) 
    await handleSingleEventCallback(element, eventName, await callback)
  else
    element.addEventListener(eventName, callback)
}

const handleNonFormattedAttribute = async (element, name, val) => {
  if (isPromise(val)) 
    await handleNonFormattedAttribute(element, await val)
  else if (isFunction(val))
    await handleNonFormattedAttribute(element, val(element, name))
  else
    element.setAttribute(name, val)
}

const handleFormattedAttribute = async (element, name, val) => {
  if (isPromise(val)) 
    await handleFormattedAttribute(element, await val)
  else if (isFunction(val))
    await handleFormattedAttribute(element, val(element, name))
  else
    element.setAttribute(camelToKebab(name), val)
}

export const appendChildren = async (children, parent = document.body) => { 
  if (!isNull(children))
    if (isPromise(children)) 
      await appendChildren(await children, parent)
    else if (isFunction(children))
      await appendChildren(children(parent), parent) 
    else if (isArray(children))
      await eachOf(children, async (child) =>
        await appendChildren(child, parent)) 
    else if (isNode(children)) 
      await appendNode(children, parent)
    else 
      await appendChildren(
        document.createTextNode(children.toString()), 
        parent
      )
}

const eachIn = async (obj, callback) => {
  for (const key in obj) 
    await callback(key, obj[key])
}

const eachOf = async (arr, callback) => {
  for (const item of arr) 
    await callback(item)
}

const camelToKebab = (str) => 
  str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()

const dataToQuery = (attributes) => 
  Object.entries(attributes)
  .map(([key, value]) => `[data-${camelToKebab(key)}=${value}]`)
  .join("")

export const find = async (query, parent = document) => 
  parent.querySelector(query)

export const findAll = async (query, parent = document) => 
  parent.querySelectorAll(query)

export const findByData = async (attributes, parent = document) => 
  await find(dataToQuery(attributes), parent)

export const findAllByData = async (attributes, parent = document) => 
  await findAll(dataToQuery(attributes), parent)

export const appendNode = async (child, parent = document.body) => {
  if (isPromise(child))
    appendNode(await child, parent)
  else if (isFunction(child))
    appendNode(child(parent), parent)
  else
    parent.appendChild(child)
}

export const removeNode = async (node) => 
  node.parentNode.removeChild(node)

export const replaceNode = async (oldNode, newNode) => 
  oldNode.replaceWith(newNode)

const isPromise = (obj) => obj instanceof Promise
const isFunction = (obj) => obj instanceof Function
const isArray = (obj) => Array.isArray(obj)
const isNode = (obj) => obj instanceof Node
const isNull = (obj) => obj === null

export default composeHTML
