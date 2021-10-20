import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';

import * as yaml from 'js-yaml';

import * as fs from 'fs';

import { EksProps } from '../props/eks-props'

export class SpaceoneAppDeploy extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, eks: EksProps) {
        super(scope, id);

        // Namespace 생성
        eks.cluster.addManifest('root-supervisor', {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: { name: 'root-supervisor' }
        });
        eks.cluster.addManifest('spaceone', {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: { name: 'spaceone' }
        });

        // SpaceONE Chart 에 사용할 values yaml 파일 로드
        let dataResult: object | undefined = undefined;

        try {
            let valuesYaml = fs.readFileSync('./values.yaml');
            let valuesParsed = yaml.load(valuesYaml.toString());
            if (typeof valuesParsed === 'object' && valuesParsed !== null) {
                dataResult = valuesParsed;
            }
        } catch {
            // pass
            console.warn(" > Failed to load 'values.yaml' for SpaceONE Helm deploy...");
            console.warn(" > Deploy continue without 'values.yaml'...");
        }

        // Helm Chart 배포
        eks.cluster.addHelmChart('spaceone', {
            release: 'spaceone',
            repository: 'https://spaceone-dev.github.io/charts',
            chart: 'spaceone',
            namespace: 'spaceone',
            values: dataResult,
        })

    }

}