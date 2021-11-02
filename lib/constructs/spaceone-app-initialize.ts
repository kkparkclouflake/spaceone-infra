import * as cdk from '@aws-cdk/core';

import * as yaml from 'js-yaml';

import * as fs from 'fs';

import { EksProps } from '../props/eks-props'

export class SpaceoneAppInitialize extends cdk.Construct {
    public readonly body: cdk.Construct;

    constructor(scope: cdk.Construct, id: string, eks: EksProps) {
        super(scope, id);

        // Chart 에 사용할 values yaml 파일 로드
        let valuesYaml: object | undefined;
            
        try {
            // Build Replace Map
            let rootValues: {[key: string]: string} = {
                '${root_domain_owner}': 'admin',
                '${root_domain_owner_password}': 'Admin123!@#',
                '${domain_name}': 'spaceone',
                '${domain_owner}': 'admin',
                '${domain_owner_password}': 'Admin123!@#',
                '${project_admin_policy_id}': 'policy-0386cce2730b',
                '${domain_admin_policy_id}': 'policy-0386cce2730b',
            }

            // Load YAML and Replace Variables
            let valuesYamlReaded = fs.readFileSync('./res/configs/initializer/values.yaml').toString();
            
            Object.keys(rootValues).forEach(function(varName) {
                valuesYamlReaded = valuesYamlReaded.replace(new RegExp(varName.replace('$', '\\$'), 'gi'), rootValues[varName]);
            });

            // Parse YAML
            let temp = yaml.load(valuesYamlReaded);
            if (typeof temp === 'object' && temp !== null) {
                valuesYaml = temp;
            }
            
        } catch (exception) {
            // pass
            console.error(' > Failed to build SpaceONE Initializer configuration...')
            console.error(exception);
            return
        }

        // Helm Chart 배포
        this.body = eks.cluster!.addHelmChart('spaceone-initializer', {
            release: 'spaceone-initializer',
            repository: 'https://raw.githubusercontent.com/kkparkclouflake/spaceone-initializer/master/repo',
            chart: 'spaceone-initializer',
            namespace: 'spaceone',
            values: valuesYaml,
        })

    }

}