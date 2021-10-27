import * as cdk from '@aws-cdk/core';

import * as yaml from 'js-yaml';

import * as fs from 'fs';

import { EksProps } from '../props/eks-props'
import { DomainProps } from '../props/domain-props';
import { SecretProps } from '../props/secret-props';
import { DatabaseProps } from '../props/database-props';

export class SpaceoneAppInitialize extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, eks: EksProps) {
        super(scope, id);

        // Chart 에 사용할 values yaml 파일 로드
        let rootYaml: object | undefined;
        let userYaml: object | undefined;
            
        try {
            // Build Replace Map
            let rootValues: {[key: string]: string} = {
                '${root_domain_owner}': 'admin',
                '${root_domain_owner_password}': 'Admin123!@#',
            }
            let userValues: {[key: string]: string} = {
                '${domain_name}': 'spaceone',
                '${domain_owner}': 'admin',
                '${domain_owner_password}': 'Admin123!@#',
                '${project_admin_policy_id}': 'policy-0386cce2730b',
                '${domain_admin_policy_id}': 'policy-0386cce2730b',
            }

            // Load YAML and Replace Variables
            let values: string[] = [];

            let rootYamlReaded = fs.readFileSync('./res/configs/initializer/root.yaml').toString();
            let userYamlReaded = fs.readFileSync('./res/configs/initializer/user.yaml').toString();
            
            Object.keys(rootValues).forEach(function(varName) {
                rootYamlReaded = rootYamlReaded.replace(new RegExp(varName.replace('$', '\\$'), 'gi'), rootValues[varName]);
            });
            Object.keys(userValues).forEach(function(varName) {
                userYamlReaded = userYamlReaded.replace(new RegExp(varName.replace('$', '\\$'), 'gi'), userValues[varName]);
            });

            // Parse YAML
            let temp = yaml.load(rootYamlReaded);
            if (typeof temp === 'object' && temp !== null) {
                rootYaml = temp;
            }
            temp = yaml.load(userYamlReaded);
            if (typeof temp === 'object' && temp !== null) {
                userYaml = temp;
            }
            
        } catch (exception) {
            // pass
            console.error(' > Failed to process SpaceONE Initialize...')
            console.error(exception);
            return
        }

        // Helm Chart 배포
        eks.cluster.addHelmChart('root-domain', {
            release: 'root-domain',
            repository: 'https://spaceone-dev.github.io/charts',
            chart: 'spaceone-initializer',
            namespace: 'spaceone',
            values: rootYaml,
        })

        // TODO: user-domain apply
        // eks.cluster.addHelmChart('user-domain', {
        //     release: 'user-domain',
        //     repository: 'https://spaceone-dev.github.io/charts',
        //     chart: 'spaceone-initializer',
        //     namespace: 'spaceone',
        //     values: userYaml,
        // })

    }

}