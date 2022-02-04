import {printTag} from '@rollingversions/tag-format';
import {PublishTarget} from '@rollingversions/types';
import {printString} from '@rollingversions/version-number';

import {getLocalImages, pushImage} from '../services/docker';
import createPublishTargetAPI from './baseTarget';

export default createPublishTargetAPI<PublishTarget.docker>({
  type: PublishTarget.docker,

  getPackageManifests(config, globalConfig) {
    const localNameWithoutTag =
      typeof config.image_name === 'string'
        ? config.image_name
        : config.image_name?.local ?? config.name;
    const localName = localNameWithoutTag.includes(`:`)
      ? localNameWithoutTag
      : `${localNameWithoutTag}:latest`;

    if (localName.split(`:`).length !== 2) {
      return [
        {
          status: 'error',
          reason: `The local image name cannot contain more than one ":". It should be in the from "image-name" or "image-name:tag"`,
        },
      ];
    }

    return [
      {
        status: 'manifest',
        manifest: {
          ...globalConfig,
          packageName: config.name,
          targetConfigs: [
            {
              type: PublishTarget.docker,
              image_name: {
                local: localName,
                remote:
                  typeof config.image_name === 'string'
                    ? config.image_name
                    : config.image_name?.remote ?? config.name,
              },
              docker_tag_formats: config.docker_tag_formats ?? [
                `{{ MAJOR }}.{{ MINOR }}.{{ PATCH }}`,
                `{{ MAJOR }}.{{ MINOR }}`,
                `{{ MAJOR }}`,
                `latest`,
              ],
            },
          ],
          dependencies: {
            required: config.dependencies || [],
            optional: [],
            development: [],
          },
        },
      },
    ];
  },

  legacyManifests: {
    pathMayContainPackage() {
      return false;
    },
    async getPackageManifest() {
      throw new Error(`Not implemented`);
    },
  },

  async prepublish(_config, _pkg, targetConfig) {
    // Check local image exists (any user-provided pre_publish script has already been run)
    const [localImageName, localImageTag] = targetConfig.image_name.local.split(
      `:`,
    );
    const localImages = await getLocalImages();
    if (
      !localImages.some(
        (img) => img.name === localImageName && img.tag === localImageTag,
      )
    ) {
      return {
        ok: false,
        reason: `Could not find the local image, "${localImageName}:${localImageTag}"`,
      };
    }

    return {ok: true};
  },

  async publish(config, pkg, targetConfig, _packageVersions) {
    if (!config.dryRun) {
      const localName = targetConfig.image_name.local;
      const remoteNames = config.canary
        ? [`${targetConfig.image_name.remote}:${printString(pkg.newVersion)}`]
        : targetConfig.docker_tag_formats.map((format) => {
            const tagName = printTag(pkg.newVersion, {
              packageName: pkg.packageName,
              oldTagName: null,
              tagFormat: format,
              versionSchema: pkg.manifest.version_schema,
            });
            return `${targetConfig.image_name.remote}:${tagName}`;
          });
      for (const remoteName of remoteNames) {
        await pushImage(localName, remoteName);
      }
    }
  },
});
