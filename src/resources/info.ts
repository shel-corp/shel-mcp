// import { ResourceDefinition } from '@modelcontextprotocol/sdk';
// import { JsonContent, RESOURCE_URIS } from '../types/resources';
// import packageJson from '../../package.json';
//
// /**
//  * Info resource providing metadata about this server
//  */
// export const infoResource: ResourceDefinition<JsonContent> = {
//   uri: RESOURCE_URIS.INFO,
//   contentType: 'application/json',
//   description: 'Server information and metadata',
//   handler: async () => {
//     return {
//       name: packageJson.name,
//       version: packageJson.version,
//       description: 'An MCP server implementation using the MCP SDK',
//       author: packageJson.author || 'Unknown',
//       license: packageJson.license,
//       tools: [
//         {
//           name: 'calculator',
//           description: 'Performs basic arithmetic operations',
//         },
//         // Add more tools as they are implemented
//       ],
//       resources: [
//         {
//           uri: RESOURCE_URIS.INFO,
//           description: 'Server information and metadata',
//         },
//         {
//           uri: RESOURCE_URIS.DOCS_OVERVIEW,
//           description: 'Overview documentation for the server',
//         },
//         {
//           uri: RESOURCE_URIS.DOCS_API,
//           description: 'API documentation for the server',
//         },
//         // Add more resources as they are implemented
//       ],
//     };
//   },
// };
