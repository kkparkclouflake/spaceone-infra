import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';

import * as yaml from 'js-yaml';

import * as fs from 'fs';

import * as lodash from 'lodash';

import { EksProps } from '../props/eks-props'

export class SpaceoneAppDeploy extends cdk.Construct {
    public readonly body: cdk.Construct;

    constructor(scope: cdk.Construct, id: string, props: EksProps) {
        super(scope, id);

        // Namespace 생성
        props.cluster!.addManifest('root-supervisor', {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: { name: 'root-supervisor' }
        });
        props.cluster!.addManifest('spaceone', {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: { name: 'spaceone' }
        });

        // SpaceONE Chart 에 사용할 values yaml 파일 로드
        let mergedValues = {};
            
        try {
            // Build Replace Map
            let valuesFiles: {[key: string]: {[key: string]: string}} = {
                './res/configs/spaceone/values.yaml': {
                    '${aws_access_key_id}': props.createdUser!.secretId,
                    '${aws_secret_access_key}': props.createdUser!.secretKey,
                    '${region_name}': props.env?.region!,
                    '${monitoring_domain}': 'monitoring.' + props.createdDomain!.domainName,
                    '${monitoring_webhook_domain}': 'monitoring-webhook.' + props.createdDomain!.domainName,
                    '${certificate-arn}': props.createdDomain!.certificate!.certificateArn!,
                    '${smtp_host}': '',
                    '${smtp_port}': '',
                    '${smtp_user}': '',
                    '${smtp_password}': '',
                },
                './res/configs/spaceone/database.yaml': {
                    '${database_user_name}': props.createdDocdb!.username,
                    '${database_user_password}': props.createdDocdb!.password,
                    '${endpoint}': props.createdDocdb!.database.clusterEndpoint.hostname,
                },
                './res/configs/spaceone/frontend.yaml': {
                    '${console-api-domain}': 'console-api.' + props.createdDomain!.domainName,
                    '${console-domain}': '*.console.' + props.createdDomain!.domainName,
                    '${certificate-arn}': props.createdDomain!.certificate!.certificateArn!,
                },
            }

            // Load YAML and Replace Variables
            let values: string[] = [];

            Object.keys(valuesFiles).forEach(function(filename) {
                let fileReaded = fs.readFileSync(filename).toString();
                let replaceMap = valuesFiles[filename];

                Object.keys(replaceMap).forEach(function(varName) {
                    fileReaded = fileReaded.replace(new RegExp(varName.replace('$', '\\$'), 'gi'), replaceMap[varName]);
                });

                values.push(fileReaded);
            });

            // Merge all parsed values
            values.forEach(function(data) {
                let valuesParsed = yaml.load(data);
                if (typeof valuesParsed === 'object' && valuesParsed !== null) {
                    mergedValues = lodash.merge(mergedValues, valuesParsed)
                }
            });
            
        } catch (exception) {
            // pass
            console.warn(" > Failed to load 'values.yaml' for SpaceONE Helm deploy...");
            console.warn(" > Deploy continue without 'values.yaml'...");
            console.error(exception);
        }

        // Helm Chart 배포
        this.body = props.cluster!.addHelmChart('spaceone', {
            release: 'spaceone',
            repository: 'https://spaceone-dev.github.io/charts',
            chart: 'spaceone',
            namespace: 'spaceone',
            values: mergedValues,
        })
    }

}