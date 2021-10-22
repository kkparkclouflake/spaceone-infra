import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam'

import * as fs from 'fs';

import { EksProps } from '../props/eks-props'

export class AwsLoadBalancerControllerDeploy extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, eks: EksProps) {
        super(scope, id);

        // Load IAM Policy from file
        let iamPolicyDocument = JSON.parse(fs.readFileSync('./res/iam/policies/aws-lb-controller-v2.3.0-iam-policy.json').toString());

        // Create Kubernetes ServiceAccount
        let svcAccount = eks.cluster.addServiceAccount('aws-load-balancer-controller', {
            name: 'aws-load-balancer-controller',
            namespace: 'kube-system',
        });

        // Create IAM Policy
        const iamPolicy = new iam.Policy(scope, 'AWSLoadBalancerControllerIAMPolicy', {
            policyName: 'AWSLoadBalancerControllerIAMPolicy',
            document: iam.PolicyDocument.fromJson(iamPolicyDocument),
        })

        // Attach IAM role
        svcAccount.role.attachInlinePolicy(iamPolicy);
    
        // Install Load Balancer Controller
        eks.cluster.addHelmChart('aws-load-balancer-controller', {
            release: 'aws-load-balancer-controller',
            repository: 'https://aws.github.io/eks-charts',
            chart: 'aws-load-balancer-controller',
            namespace: 'kube-system',
            values: {
                'clusterName': eks.cluster.clusterName,
                'serviceAccount': {
                    'create': false,
                    'name': 'aws-load-balancer-controller',
                }
            },
        })
    }
}