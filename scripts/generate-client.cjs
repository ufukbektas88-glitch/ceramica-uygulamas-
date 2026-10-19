// Prisma's supported JS driver mode needs no downloaded Rust runtime.
const { getGenerators } = require("@prisma/internals");
(async () => {
  const generators = await getGenerators({
    schemaPath: "prisma/schema.prisma",
    skipDownload: true,
    registry: {
      "prisma-client-js": {
        type: "rpc",
        generatorPath: require.resolve(
          "@prisma/client/generator-build/index.js",
        ),
        isNode: true,
      },
    },
  });
  try {
    for (const generator of generators) await generator.generate();
  } finally {
    for (const generator of generators) generator.stop();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
